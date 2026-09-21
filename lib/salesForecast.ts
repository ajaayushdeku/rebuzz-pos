/**
 * The "What's coming" forecast on the Sales & Revenue page.
 *
 * Plain arithmetic on the business's own daily sales — no model is asked for
 * a number. Three things move a day's forecast, and each is shown on the card
 * as a driver with its effect:
 *
 * - **Weekday**: the starting point is what this weekday usually sells, from
 *   the last eight of them (holidays left out, since they are not usual days).
 * - **Trend**: the last two weeks against the two before. Only half of the
 *   change is carried forward, and never more than 15%: a short run up or
 *   down usually settles back, and a forecast that chases it overshoots.
 * - **Holidays**: a day on the holiday calendar is moved by how this business
 *   actually sold on the holidays already past this year. With none measured
 *   yet it is left alone, and confidence drops, rather than guessed at.
 *
 * Confidence is how steady each weekday has been, and how many weeks of
 * history there are to judge that by.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import type { HolidayEvent } from "@/lib/holidayCalendar";
import {
  matters,
  pastHolidayEffect,
  holidayDateSet,
  type DailySalesRow,
} from "@/lib/ai-insights/sections/festivalPrep";
import { changePct, shiftIsoDate } from "@/lib/ai-insights/sections/shared";

/** How far back the forecast reads: enough to measure this year's holidays. */
export const FORECAST_HISTORY_DAYS = 150;

/** How many of each weekday make its usual day. */
const BASELINE_WEEKS = 8;
/** Below two weeks there is not one of each weekday to go on. */
const MIN_HISTORY_DAYS = 14;
const TREND_DAYS = 14;
/** The share of the recent trend carried into the forecast, and its ceiling. */
const TREND_CARRY = 0.5;
const TREND_CAP_PCT = 15;
/** How far a holiday may move a day, however extreme past holidays were. */
const HOLIDAY_MIN_PCT = -80;
const HOLIDAY_MAX_PCT = 100;
/** Weekday swings smaller than this read as "a typical day". */
const WEEKDAY_NOTABLE_PCT = 5;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type ConfidenceLevel = "High" | "Likely" | "Moderate" | "Low";
const LEVELS: ConfidenceLevel[] = ["Low", "Moderate", "Likely", "High"];

export interface ForecastDriver {
  /** "other" only comes from the AI: a factor that is none of the three. */
  kind: "weekday" | "trend" | "holiday" | "other";
  label: string;
  description: string;
  /** Percent, signed. Null when it could not be measured. */
  impact: number | null;
}

export interface ForecastOk {
  status: "ok";
  /** The day the forecast was made, in Nepal. Sales up to yesterday count. */
  today: string;
  /**
   * The first of the seven days forecast. Tomorrow, except for a saved AI
   * forecast from yesterday, served because a fresh one failed — then today.
   */
  forecastFrom: string;
  /** Weeks of sales the usual days were worked out from. */
  basedOnWeeks: number;
  tomorrowWeekday: string;
  tomorrowForecast: number;
  /** What tomorrow's weekday usually sells, before trend and holidays. */
  tomorrowBaseline: number;
  /** Tomorrow and the six days after it. */
  weeklyProjection: number;
  weeklyBaseline: number;
  confidence: ConfidenceLevel;
  drivers: ForecastDriver[];
  /**
   * Who made the forecast. The baselines are always the app's — they are
   * what happened, not a prediction — and everything else is the AI's when
   * this says so.
   */
  source: "ai" | "calculated";
  /** The AI's one-line outlook for the week. */
  outlook?: string;
  model?: string;
  generatedAt?: string;
  /** The AI's last good answer, served because a fresh one failed. */
  stale?: boolean;
  staleReason?: string;
  /** Why this is the calculated forecast rather than the AI's. */
  aiError?: string;
}

export type SalesForecast =
  | ForecastOk
  | {
      status: "not-enough-history";
      daysOfHistory: number;
      daysNeeded: number;
    }
  | {
      /** Nothing sold in the last two weeks. */
      status: "no-recent-sales";
      /** The last day anything was sold, as an ISO date. */
      lastSale: string;
    };

const weekdayOf = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

function daysBetween(from: string, to: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

const mean = (values: number[]) =>
  values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

/**
 * A weekday's usual takings: the average, less its best and worst day once
 * there are enough to spare. One catering order or one day shut for repairs
 * should not set what a normal Friday looks like.
 */
function usual(samples: number[]): number {
  if (samples.length < 5) return mean(samples);
  const sorted = [...samples].sort((a, b) => a - b);
  return mean(sorted.slice(1, -1));
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value);

function lowerLevel(level: ConfidenceLevel): ConfidenceLevel {
  return LEVELS[Math.max(0, LEVELS.indexOf(level) - 1)];
}

function capLevel(level: ConfidenceLevel, cap: ConfidenceLevel) {
  return LEVELS[Math.min(LEVELS.indexOf(level), LEVELS.indexOf(cap))];
}

/**
 * The sales history both forecasts start from: each day's takings, when the
 * business started trading, and what each weekday usually sells.
 */
export function readSalesHistory(
  today: string,
  daily: DailySalesRow[],
  events: HolidayEvent[],
) {
  // What customers paid each day, refunded bills already taken out by the
  // report — the same figure the rest of the page and the targets use. A
  // day missing from the report sold nothing.
  const byDate = new Map<string, { revenue: number; bills: number }>();
  for (const row of daily) {
    if (!row.date) continue;
    byDate.set(row.date.slice(0, 10), {
      revenue: row.totalRevenue ?? 0,
      bills: row.totalSales ?? 0,
    });
  }
  const dayRevenue = (iso: string) => byDate.get(iso)?.revenue ?? 0;
  const dayBills = (iso: string) => byDate.get(iso)?.bills ?? 0;

  // Days before the first sale are before the business used the POS, not
  // days it sold nothing, and would drag every average down.
  const sold = [...byDate.entries()]
    .filter(([date, day]) => day.revenue > 0 && date < today)
    .map(([date]) => date)
    .sort();
  const firstSale: string | undefined = sold[0];
  const lastSale: string | undefined = sold[sold.length - 1];
  const daysOfHistory = firstSale ? daysBetween(firstSale, today) : 0;

  const holidayDates = holidayDateSet(events);
  const isUsualDay = (iso: string) =>
    firstSale !== undefined && iso >= firstSale && !holidayDates.has(iso);

  // ── Each weekday's usual takings ──
  const samples: number[][] = WEEKDAYS.map(() => []);
  for (let i = 1; i <= BASELINE_WEEKS * 7; i++) {
    const iso = shiftIsoDate(today, -i);
    if (!isUsualDay(iso)) continue;
    samples[weekdayOf(iso)].push(dayRevenue(iso));
  }
  const measured = samples.filter((s) => s.length > 0);
  const overall = mean(measured.map(usual));
  // A weekday with no usual day in the window (every one a holiday) takes
  // the overall figure instead of reading as zero.
  const baselines = samples.map((s) => (s.length > 0 ? usual(s) : overall));

  /** Tomorrow and the six days after, with what each weekday usually sells. */
  const nextWeek = Array.from({ length: 7 }, (_, i) => {
    const date = shiftIsoDate(today, i + 1);
    return {
      date,
      weekday: WEEKDAYS[weekdayOf(date)],
      baseline: baselines[weekdayOf(date)],
      holiday: holidayDates.has(date),
    };
  });

  return {
    dayRevenue,
    dayBills,
    firstSale,
    lastSale,
    daysOfHistory,
    holidayDates,
    isUsualDay,
    samples,
    baselines,
    nextWeek,
    basedOnWeeks: Math.min(BASELINE_WEEKS, Math.floor(daysOfHistory / 7)),
  };
}

export type SalesHistory = ReturnType<typeof readSalesHistory>;

/**
 * The usual figures for the seven days from `start`: its weekday, what that
 * weekday usually sells, and what the week usually sells. For a saved AI
 * forecast made on an earlier day, whose days start before tomorrow.
 */
export function usualWeekFrom(history: SalesHistory, start: string) {
  const days = Array.from({ length: 7 }, (_, i) => shiftIsoDate(start, i));
  const baselineOf = (iso: string) => history.baselines[weekdayOf(iso)];
  return {
    weekday: WEEKDAYS[weekdayOf(start)],
    dayBaseline: round(baselineOf(start)),
    weekBaseline: round(days.reduce((sum, d) => sum + baselineOf(d), 0)),
  };
}

/**
 * Whether there is enough to forecast from at all, and if not, what the card
 * should say instead. Null when there is.
 */
export function forecastBlocker(history: SalesHistory): SalesForecast | null {
  if (!history.firstSale || history.daysOfHistory < MIN_HISTORY_DAYS) {
    return {
      status: "not-enough-history",
      daysOfHistory: history.daysOfHistory,
      daysNeeded: MIN_HISTORY_DAYS,
    };
  }
  // Two weeks with nothing sold is a shop that is shut or not using the POS
  // right now. Any figure for tomorrow would be invented, by anyone.
  const recent = Array.from({ length: TREND_DAYS }, (_, i) =>
    shiftIsoDate(history.nextWeek[0].date, -(i + 2)),
  ).filter(history.isUsualDay);
  if (
    history.lastSale &&
    recent.length > 0 &&
    recent.every((iso) => history.dayRevenue(iso) === 0)
  ) {
    return { status: "no-recent-sales", lastSale: history.lastSale };
  }
  return null;
}

export function buildSalesForecast(
  today: string,
  daily: DailySalesRow[],
  events: HolidayEvent[],
): SalesForecast {
  const history = readSalesHistory(today, daily, events);
  const blocked = forecastBlocker(history);
  if (blocked) return blocked;

  const { dayRevenue, isUsualDay, samples, baselines } = history;
  const averageDay = mean(baselines);

  // ── Trend: the last two weeks against the two before ──
  const window = (from: number) => {
    const values: number[] = [];
    for (let i = from; i < from + TREND_DAYS; i++) {
      const iso = shiftIsoDate(today, -i);
      if (isUsualDay(iso)) values.push(dayRevenue(iso));
    }
    return values;
  };
  const recent = window(1);
  const before = window(1 + TREND_DAYS);
  // `usual`, not a plain average, for the same reason as the weekdays: one
  // huge day — a catering order, a test bill — would otherwise make the
  // fortnight it fell in look many times busier than it was.
  const trendPct =
    recent.length >= 7 && before.length >= 7
      ? changePct(usual(recent), usual(before))
      : null;
  const trendApplied =
    trendPct === null
      ? 0
      : round(clamp(trendPct * TREND_CARRY, -TREND_CAP_PCT, TREND_CAP_PCT));

  // ── Holidays: measured on this year's, applied to the coming week's ──
  const holidayPct = pastHolidayEffect(today, dayRevenue, events).pct;
  const holidayApplied =
    holidayPct === null
      ? null
      : round(clamp(holidayPct, HOLIDAY_MIN_PCT, HOLIDAY_MAX_PCT));

  const days = history.nextWeek.map(({ date, baseline, holiday }) => {
    const holidayFactor =
      holiday && holidayApplied !== null ? 1 + holidayApplied / 100 : 1;
    return {
      date,
      holiday,
      baseline,
      forecast: baseline * (1 + trendApplied / 100) * holidayFactor,
    };
  });
  const [tomorrow] = days;
  const tomorrowWeekday = WEEKDAYS[weekdayOf(tomorrow.date)];

  // ── Confidence ──
  // How far a weekday's days stray from its own average, on average, as a
  // share of it. Summed across weekdays, so busy days count for more.
  let deviation = 0;
  let level = 0;
  for (const s of samples) {
    if (s.length < 3) continue;
    const m = mean(s);
    deviation += s.reduce((sum, v) => sum + Math.abs(v - m), 0) / s.length;
    level += m;
  }
  const spread = level > 0 ? deviation / level : 1;
  // A day typically within 10% of its weekday's average is steady enough to
  // plan by; one that strays 30% or more is a guess.
  let confidence: ConfidenceLevel =
    spread < 0.1
      ? "High"
      : spread < 0.18
        ? "Likely"
        : spread < 0.3
          ? "Moderate"
          : "Low";
  const weeks = history.basedOnWeeks;
  if (weeks < 4) confidence = "Low";
  else if (weeks < 6) confidence = capLevel(confidence, "Likely");

  // ── Drivers, in the order they shape tomorrow ──
  const drivers: ForecastDriver[] = [];

  const weekdayPct = changePct(tomorrow.baseline, averageDay);
  if (weekdayPct !== null) {
    const n = samples[weekdayOf(tomorrow.date)].length;
    const pct = round(weekdayPct);
    drivers.push({
      kind: "weekday",
      label:
        pct >= WEEKDAY_NOTABLE_PCT
          ? `${tomorrowWeekday}s are busier`
          : pct <= -WEEKDAY_NOTABLE_PCT
            ? `${tomorrowWeekday}s are quieter`
            : `${tomorrowWeekday}s are typical`,
      description:
        Math.abs(pct) < 1
          ? `Tomorrow is a ${tomorrowWeekday}. Your last ${n} ${tomorrowWeekday}s sold about the same as your average day.`
          : `Tomorrow is a ${tomorrowWeekday}. Your last ${n} ${tomorrowWeekday}s sold ${Math.abs(pct)}% ${pct > 0 ? "more" : "less"} than your average day.`,
      impact: pct,
    });
  }

  if (trendPct !== null) {
    const raw = round(trendPct);
    drivers.push({
      kind: "trend",
      label:
        trendApplied > 0
          ? "Sales are rising"
          : trendApplied < 0
            ? "Sales are slowing"
            : "Sales are steady",
      description:
        Math.abs(raw) < 1
          ? "The last two weeks sold about the same as the two before."
          : `The last two weeks sold ${Math.abs(raw)}% ${raw > 0 ? "more" : "less"} than the two before. Half of that is carried into the forecast, up to ${TREND_CAP_PCT}%.`,
      impact: trendApplied,
    });
  }

  // The first holiday in the coming week, if any.
  const coming = events
    .filter(matters)
    .filter((e) => e.end >= days[0].date && e.start <= days[6].date)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (coming) {
    const start = coming.start > days[0].date ? coming.start : days[0].date;
    const when =
      start === days[0].date ? "tomorrow" : `on ${WEEKDAYS[weekdayOf(start)]}`;
    drivers.push({
      kind: "holiday",
      label: `${coming.label} ${when}`,
      description:
        holidayApplied === null
          ? `There are no past holidays in your sales yet to measure how they change your day, so ${coming.label} is not adjusted. Treat that day as a rough guess.`
          : `On the holidays so far this year you sold ${Math.abs(holidayApplied)}% ${holidayApplied >= 0 ? "more" : "less"} than on a usual day, so ${coming.label} is adjusted by that.`,
      impact: holidayApplied,
    });
    if (holidayApplied === null) confidence = lowerLevel(confidence);
  }

  return {
    status: "ok",
    source: "calculated",
    today,
    forecastFrom: tomorrow.date,
    basedOnWeeks: weeks,
    tomorrowWeekday,
    tomorrowForecast: round(tomorrow.forecast),
    tomorrowBaseline: round(tomorrow.baseline),
    weeklyProjection: round(days.reduce((sum, d) => sum + d.forecast, 0)),
    weeklyBaseline: round(days.reduce((sum, d) => sum + d.baseline, 0)),
    confidence,
    drivers,
  };
}
