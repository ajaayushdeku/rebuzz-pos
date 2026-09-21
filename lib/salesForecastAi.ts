/**
 * The AI's side of the "What's coming" forecast.
 *
 * The model is given the business's own sales, day by day, and makes the
 * forecast itself: tomorrow's figure, the week's, how sure it is, what is
 * driving it and a line on the week ahead. The app supplies only facts —
 * every day's takings, which days are holidays, how past holidays sold, and
 * what each weekday usually sells as a reference point.
 *
 * Its answer is checked before it is shown (`parseAiForecast`): a figure that
 * is not a number, a week smaller than the day inside it, or a day several
 * times bigger than anything this business has ever sold is refused, and the
 * card falls back to the calculated forecast rather than print it.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import type { HolidayEvent } from "@/lib/holidayCalendar";
import {
  matters,
  pastHolidayEffect,
} from "@/lib/ai-insights/sections/festivalPrep";
import {
  formatMoney,
  shiftIsoDate,
  signed,
  textOr,
} from "@/lib/ai-insights/sections/shared";
import type { AiInsightsEnvelope } from "@/lib/ai-insights/contract";
import { nepalDateString } from "@/lib/nepalDate";
import {
  usualWeekFrom,
  type ConfidenceLevel,
  type ForecastDriver,
  type ForecastOk,
  type SalesHistory,
} from "@/lib/salesForecast";

/** Part of the cache key: bump when the prompt or the facts change. */
export const SALES_FORECAST_VERSION = "v3";

const DAILY_DAYS = 56;
const WEEKLY_WEEKS = 20;
const MAX_DRIVERS = 3;
/** A forecast this many times the best day or week on record is refused. */
const IMPLAUSIBLE_MULTIPLE = 5;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const weekdayOf = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** The holiday a date falls in, if any. */
function holidayOn(iso: string, events: HolidayEvent[]) {
  return events.find((e) => matters(e) && e.start <= iso && e.end >= iso);
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function salesForecastBriefing(
  today: string,
  history: SalesHistory,
  events: HolidayEvent[],
  symbol: string,
): string {
  const money = (v: number) => formatMoney(symbol, v);
  const { dayRevenue, dayBills, firstSale, samples, baselines } = history;

  const lines: string[] = [
    `Today is ${today} (${WEEKDAYS[weekdayOf(today)]}), in Nepal. Sales up to yesterday are complete; today's are not included.`,
    `Currency: ${symbol}`,
    `This business has sold on the POS since ${firstSale} (${history.daysOfHistory} days).`,
    "",
    "Days to forecast (tomorrow first). The usual figure is what that weekday sold on a normal day lately:",
    ...history.nextWeek.map((d) => {
      const h = holidayOn(d.date, events);
      return `- ${d.date} ${d.weekday} · usual ${money(d.baseline)}${
        h ? ` · HOLIDAY: ${h.label}` : ""
      }`;
    }),
    "",
    `Daily sales, last ${DAILY_DAYS} days, newest first. Days with no sales show ${money(0)}:`,
  ];

  for (let i = 1; i <= DAILY_DAYS; i++) {
    const iso = shiftIsoDate(today, -i);
    if (firstSale && iso < firstSale) break;
    const h = holidayOn(iso, events);
    lines.push(
      `- ${iso} ${WEEKDAYS[weekdayOf(iso)].slice(0, 3)}: ${money(dayRevenue(iso))} · ${dayBills(iso)} bills${
        h ? ` · holiday: ${h.label}` : ""
      }`,
    );
  }

  lines.push(
    "",
    "Usual day by weekday (the last 8 of each, holidays left out, best and worst day dropped):",
    ...WEEKDAYS.map(
      (day, i) =>
        `- ${day}: ${money(baselines[i])} (${samples[i].length} days measured)`,
    ),
  );

  // A longer view than the daily list, for seasonality and slow drifts.
  lines.push("", `Weekly totals, last ${WEEKLY_WEEKS} weeks, newest first:`);
  for (let w = 0; w < WEEKLY_WEEKS; w++) {
    const end = shiftIsoDate(today, -1 - 7 * w);
    const start = shiftIsoDate(end, -6);
    if (firstSale && end < firstSale) break;
    let total = 0;
    for (let d = 0; d < 7; d++) total += dayRevenue(shiftIsoDate(start, d));
    lines.push(`- ${start} to ${end}: ${money(total)}`);
  }

  const { pastHolidays, pct } = pastHolidayEffect(today, dayRevenue, events);
  lines.push(
    "",
    "Past holidays this year (sales per day on the holiday against the same weekday in the 4 weeks before):",
  );
  if (pastHolidays.length === 0) {
    lines.push("- None in this business's sales history yet.");
  } else {
    for (const h of [...pastHolidays].reverse().slice(0, 8)) {
      lines.push(
        `- ${h.label}, ${h.start}: ${money(h.revenue)} a day against usual ${money(h.usual)}${
          h.changePct !== null ? ` (${signed(Math.round(h.changePct))})` : ""
        }`,
      );
    }
    if (pct !== null) {
      lines.push(`- All of them together: ${signed(Math.round(pct))}`);
    }
  }

  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const SALES_FORECAST_PROMPT = `You forecast sales for the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS. You receive this business's own sales history, day by day, and the days to forecast. Work out the forecast yourself.

Answer with:
- tomorrowForecast: total sales expected tomorrow, a whole number in the business's currency, no symbol.
- weeklyProjection: total sales expected over all 7 days listed, tomorrow included, a whole number.
- confidence: "High", "Likely", "Moderate" or "Low" — how much the owner can plan by it, given how steady the history is and how much of it there is.
- drivers: 2 or 3 reasons behind the forecast, the one that moves it most first. Each is a different factor — never two about the same thing. For each:
  - kind: "weekday" (tomorrow's day of the week), "trend" (sales rising or falling lately), "holiday" (a holiday in the days to forecast) or "other" (anything else in the facts: days with no sales, a one-off day left out, a busy day later in the week).
  - label: under 40 characters, a plain statement of the finding, e.g. "Tuesdays sell 18% more" or "Sales down a quarter lately". Not a heading like "Weekday effect".
  - description: one sentence under 160 characters. Quote the figure from the facts it rests on, then say what it means for the days ahead, e.g. "A typical day in the last two weeks sold Rs 900 against Rs 1,200 before, so the week is set lower."
  - impact: how much this factor moved your forecast, as a signed whole-number percent against the usual figure. The impacts of the trend and holiday drivers together must match the gap between your weekly projection and the usual week listed; a driver that only explains, and did not move the number, has impact 0.
- outlook: one sentence under 90 characters about the week ahead, with no money figures, saying which days to plan for.

Rules:
- Start from the usual figure for each day, then adjust for the recent trend and for holidays. Every adjustment you make must appear as a driver.
- A single day far above or below everything around it is a one-off — a catering order, a mistake, a test bill. Do not let it move the forecast; mention it only if it would otherwise mislead.
- A holiday's effect must come from the past holidays given. With none measured, do not adjust for it, give it impact 0 and say so.
- Short runs up or down usually settle back: carry a recent trend forward only partly.
- Never invent weather, local events, promotions or anything else the facts do not contain.
- With little history or days that vary a lot, say "Moderate" or "Low".
- Plain words for a busy owner. No markdown, no emoji.`;

export const SALES_FORECAST_SCHEMA = {
  type: "object",
  properties: {
    tomorrowForecast: { type: "number" },
    weeklyProjection: { type: "number" },
    confidence: {
      type: "string",
      enum: ["High", "Likely", "Moderate", "Low"],
    },
    drivers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["weekday", "trend", "holiday", "other"],
          },
          label: { type: "string" },
          description: { type: "string" },
          impact: { type: "number" },
        },
        required: ["kind", "label", "description", "impact"],
      },
    },
    outlook: { type: "string" },
  },
  required: [
    "tomorrowForecast",
    "weeklyProjection",
    "confidence",
    "drivers",
    "outlook",
  ],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface AiForecast {
  tomorrowForecast: number;
  weeklyProjection: number;
  confidence: ConfidenceLevel;
  drivers: ForecastDriver[];
  outlook: string | null;
}

const CONFIDENCE: ConfidenceLevel[] = ["High", "Likely", "Moderate", "Low"];
const KINDS: ForecastDriver["kind"][] = [
  "weekday",
  "trend",
  "holiday",
  "other",
];

const amount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;

/**
 * The model's forecast, or null when it cannot be shown.
 *
 * Null rather than repaired: a forecast is one number the owner may plan
 * stock and staff by, and a wrong one presented as the AI's is worse than
 * the calculated one presented as calculated.
 */
export function parseAiForecast(
  value: unknown,
  history: SalesHistory,
  today: string,
): AiForecast | null {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const obj = (raw ?? {}) as Record<string, unknown>;

  const tomorrowForecast = amount(obj.tomorrowForecast);
  const weeklyProjection = amount(obj.weeklyProjection);
  if (tomorrowForecast === null || weeklyProjection === null) return null;
  // The week contains tomorrow.
  if (weeklyProjection < tomorrowForecast) return null;

  // Far beyond anything this business has sold is a model that misread the
  // figures, not a forecast.
  let bestDay = 0;
  let bestWeek = 0;
  for (let w = 0; w < 20; w++) {
    let week = 0;
    for (let d = 1; d <= 7; d++) {
      const day = history.dayRevenue(shiftIsoDate(today, -(7 * w + d)));
      bestDay = Math.max(bestDay, day);
      week += day;
    }
    bestWeek = Math.max(bestWeek, week);
  }
  if (
    tomorrowForecast > IMPLAUSIBLE_MULTIPLE * Math.max(bestDay, 1) ||
    weeklyProjection > IMPLAUSIBLE_MULTIPLE * Math.max(bestWeek, 1)
  ) {
    return null;
  }

  const confidence = CONFIDENCE.find((c) => c === obj.confidence);
  if (!confidence) return null;

  const drivers: ForecastDriver[] = [];
  for (const entry of Array.isArray(obj.drivers) ? obj.drivers : []) {
    const d = (entry ?? {}) as Record<string, unknown>;
    const label = textOr(d.label, 60);
    const description = textOr(d.description, 220);
    if (!label || !description) continue;
    const impact =
      typeof d.impact === "number" && Number.isFinite(d.impact)
        ? Math.round(Math.max(-100, Math.min(500, d.impact)))
        : null;
    drivers.push({
      kind: KINDS.find((k) => k === d.kind) ?? "other",
      label,
      description,
      impact,
    });
    if (drivers.length >= MAX_DRIVERS) break;
  }

  return {
    tomorrowForecast,
    weeklyProjection,
    confidence,
    drivers,
    outlook: textOr(obj.outlook, 140),
  };
}

// ── Choosing what the card shows ──────────────────────────────────────────

/**
 * The AI forecast when there is a usable one, new or saved; otherwise the
 * calculated one, marked with why.
 *
 * `answer` is what the AI service sent back. When the AI failed, the service
 * sends its last saved forecast instead, marked `stale` — today's, or, since
 * saved answers last 26 hours, yesterday's. Yesterday's starts today rather
 * than tomorrow, but its days are still ahead, so it is kept, dated from
 * today, and compared against the usual figures for its own days. Only a
 * forecast whose days have all passed, or one that fails the checks, gives
 * way to the calculation.
 */
export function resolveForecast(
  calculated: ForecastOk,
  answer: AiInsightsEnvelope & { cached?: boolean },
  history: SalesHistory,
  today: string,
): ForecastOk {
  const { insights, model, generatedAt, stale, staleReason } = answer;
  const fallback = (aiError: string): ForecastOk => ({
    ...calculated,
    aiError,
  });

  const tomorrow = calculated.forecastFrom;
  const madeOn = nepalDateString(generatedAt) ?? today;
  const forecastFrom = stale ? shiftIsoDate(madeOn, 1) : tomorrow;
  if (forecastFrom > tomorrow || shiftIsoDate(forecastFrom, 6) < tomorrow) {
    return fallback(staleReason ?? "AI_UNAVAILABLE");
  }

  const ai = parseAiForecast(insights, history, today);
  if (!ai) {
    // A saved forecast that fails the checks is reported with the reason the
    // new one failed; a new one that fails them, as an unreadable answer.
    return fallback(
      stale ? (staleReason ?? "AI_UNAVAILABLE") : "AI_MALFORMED_RESPONSE",
    );
  }

  const usualWeek = usualWeekFrom(history, forecastFrom);
  return {
    ...calculated,
    source: "ai",
    forecastFrom,
    tomorrowWeekday: usualWeek.weekday,
    tomorrowBaseline: usualWeek.dayBaseline,
    weeklyBaseline: usualWeek.weekBaseline,
    tomorrowForecast: ai.tomorrowForecast,
    weeklyProjection: ai.weeklyProjection,
    confidence: ai.confidence,
    drivers: ai.drivers,
    outlook: ai.outlook ?? undefined,
    model,
    generatedAt,
    stale: stale === true,
    staleReason,
  };
}
