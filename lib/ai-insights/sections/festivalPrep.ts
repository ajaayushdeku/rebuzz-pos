/**
 * Upcoming Festival Prep on the AI Insights page.
 *
 * Three kinds of fact, each from where it can be trusted:
 *
 * - **When**: the festivals and public holidays in the next 60 days, from the
 *   official 2083 BS holiday notice (`lib/holidayCalendar`). The model never
 *   supplies a date; it answers by event id and the dates are joined back on.
 * - **How this business trades on days off**: its sales on the public holidays
 *   already past this year, against the same weekday in the weeks before, and
 *   Saturdays against other days. Last year's festival sales would be better,
 *   but the calendar only holds this year's dates and most businesses have not
 *   been on the POS a full year.
 * - **What it sells**: the last 30 days' best sellers, so "stock up on" names
 *   real menu items, checked against the menu.
 *
 * What people in Nepal do at each festival is left to the model's general
 * knowledge, and the prompt says not to present it as this business's data.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import { HOLIDAY_EVENTS, type HolidayEvent } from "@/lib/holidayCalendar";
import { buildMenuFacts, type MenuLine } from "./menuSuggestions";
import {
  formatMoney,
  changePct,
  productMatcher,
  shiftIsoDate,
  textOr,
  whole,
  type AiSectionResult,
  type MenuProduct,
  type SalesByItemRow,
  type SalesWindows,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const FESTIVAL_PREP_VERSION = "v1";

/** How far ahead the section looks. */
export const FESTIVAL_LOOKAHEAD_DAYS = 60;
/** How far back past holidays are compared. */
export const FESTIVAL_HISTORY_DAYS = 150;

const MAX_EVENTS = 6;
const WEEKDAY_WEEKS = 8;
/** Weeks before a past holiday that make up its "usual day". */
const BASELINE_WEEKS = 4;
const MAX_PAST_HOLIDAYS = 8;

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

function daysBetween(from: string, to: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

/** One day of `/business/report/compare-sales-by-date`. Days with no sales are absent. */
export interface DailySalesRow {
  date?: string;
  totalSales?: number;
  totalRevenue?: number;
  totalTax?: number;
}

// ── Facts ─────────────────────────────────────────────────────────────────

/** The events worth preparing for: anything the offer builder knows, and every national holiday. */
const matters = (e: HolidayEvent) =>
  Boolean(e.festivalId) || e.scope === "national";

export interface UpcomingEvent {
  id: string;
  label: string;
  icon: string;
  start: string;
  end: string;
  days: number;
  bsLabel: string;
  scope: HolidayEvent["scope"];
  note?: string;
  festivalId?: string;
  /** Days until it starts; zero or less once it has. */
  daysAway: number;
}

export interface PastHoliday {
  label: string;
  start: string;
  days: number;
  /** Average sales a day during the holiday, before tax. */
  revenue: number;
  /** Average for the same weekdays in the weeks before. */
  usual: number;
  changePct: number | null;
}

export interface FestivalFacts {
  today: string;
  upcoming: UpcomingEvent[];
  /** Average sales and orders per weekday over the last eight weeks. */
  weekdays: { day: string; revenue: number; orders: number }[];
  saturdayVsOtherDaysPct: number | null;
  pastHolidays: PastHoliday[];
  /** All past holiday days together against their usual days. */
  pastHolidaysPct: number | null;
  bestSellers: MenuLine[];
}

export function upcomingEvents(
  today: string,
  // The notice by default; the route passes it merged with Google's calendar.
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): UpcomingEvent[] {
  const horizon = shiftIsoDate(today, FESTIVAL_LOOKAHEAD_DAYS);
  return events
    .filter((e) => matters(e) && e.end >= today && e.start <= horizon)
    .slice(0, MAX_EVENTS)
    .map((e) => ({
      id: e.id,
      label: e.label,
      icon: e.icon,
      start: e.start,
      end: e.end,
      days: e.days,
      bsLabel: e.bsLabel,
      scope: e.scope,
      note: e.note,
      festivalId: e.festivalId,
      daysAway: daysBetween(today, e.start),
    }));
}

export function buildFestivalFacts(
  today: string,
  menu: MenuProduct[],
  salesRows: SalesByItemRow[],
  daily: DailySalesRow[],
  windows: SalesWindows,
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): FestivalFacts {
  // Sales per day before tax. A day missing from the report sold nothing,
  // and is counted as zero on both sides of every comparison below, so a
  // shop that shut for a holiday reads as a fall rather than being skipped.
  const byDate = new Map<string, { revenue: number; orders: number }>();
  for (const row of daily) {
    if (!row.date) continue;
    byDate.set(row.date.slice(0, 10), {
      revenue: (row.totalRevenue ?? 0) - (row.totalTax ?? 0),
      orders: row.totalSales ?? 0,
    });
  }
  const dayRevenue = (iso: string) => byDate.get(iso)?.revenue ?? 0;

  const holidayDates = new Set<string>();
  for (const e of events.filter(matters)) {
    for (let i = 0; i < e.days; i++) holidayDates.add(shiftIsoDate(e.start, i));
  }

  // ── Weekdays over the last eight weeks, holidays left out ──
  const sums = WEEKDAYS.map(() => ({ revenue: 0, orders: 0, days: 0 }));
  for (let i = 1; i <= WEEKDAY_WEEKS * 7; i++) {
    const iso = shiftIsoDate(today, -i);
    if (holidayDates.has(iso)) continue;
    const s = sums[weekdayOf(iso)];
    s.revenue += dayRevenue(iso);
    s.orders += byDate.get(iso)?.orders ?? 0;
    s.days += 1;
  }
  const anyRecentSales = sums.some((s) => s.revenue > 0);
  const weekdays = anyRecentSales
    ? sums.map((s, i) => ({
        day: WEEKDAYS[i],
        revenue: s.days > 0 ? s.revenue / s.days : 0,
        orders: s.days > 0 ? Math.round((s.orders / s.days) * 10) / 10 : 0,
      }))
    : [];
  const saturday = weekdays[6]?.revenue ?? 0;
  const others =
    weekdays.length > 0
      ? weekdays.slice(0, 6).reduce((sum, d) => sum + d.revenue, 0) / 6
      : 0;
  const saturdayVsOtherDaysPct =
    weekdays.length > 0 ? changePct(saturday, others) : null;

  // ── Past holidays this year, against the same weekdays just before ──
  const historyStart = shiftIsoDate(today, -FESTIVAL_HISTORY_DAYS);
  const past = events.filter(
    (e) => matters(e) && e.end < today && e.start >= historyStart,
  );

  const pastHolidays: PastHoliday[] = [];
  let allHoliday = 0;
  let allUsual = 0;
  for (const e of past) {
    let revenue = 0;
    let usual = 0;
    for (let i = 0; i < e.days; i++) {
      const iso = shiftIsoDate(e.start, i);
      revenue += dayRevenue(iso);

      // The same weekday in each of the weeks before, skipping other holidays.
      let sum = 0;
      let count = 0;
      for (let w = 1; w <= BASELINE_WEEKS; w++) {
        const earlier = shiftIsoDate(iso, -7 * w);
        if (holidayDates.has(earlier) || earlier < historyStart) continue;
        sum += dayRevenue(earlier);
        count += 1;
      }
      usual += count > 0 ? sum / count : 0;
    }
    // Nothing sold on the holiday or around it: the business was probably not
    // trading yet, and the comparison would say nothing.
    if (revenue === 0 && usual === 0) continue;

    allHoliday += revenue;
    allUsual += usual;
    pastHolidays.push({
      label: e.label,
      start: e.start,
      days: e.days,
      revenue: revenue / e.days,
      usual: usual / e.days,
      changePct: changePct(revenue, usual),
    });
  }

  return {
    today,
    upcoming: upcomingEvents(today, events),
    weekdays,
    saturdayVsOtherDaysPct,
    // Most recent first, so the model reads the freshest behaviour first.
    pastHolidays: pastHolidays.reverse().slice(0, MAX_PAST_HOLIDAYS),
    pastHolidaysPct:
      pastHolidays.length > 0 ? changePct(allHoliday, allUsual) : null,
    bestSellers: buildMenuFacts(menu, salesRows, windows).bestSellers,
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

const signedPct = (pct: number) => `${pct > 0 ? "+" : ""}${pct}%`;

export function festivalBriefing(
  facts: FestivalFacts,
  currencySymbol: string,
): string {
  const money = (value: number) => formatMoney(currencySymbol, value);

  const when = (e: UpcomingEvent) =>
    e.daysAway > 0
      ? `in ${e.daysAway} days`
      : e.daysAway === 0
        ? "starts today"
        : "under way";
  const who = (e: UpcomingEvent) =>
    e.scope === "national"
      ? "national public holiday"
      : e.scope === "occasion"
        ? "occasion, not a holiday"
        : `holiday for ${e.note ?? "some groups"}`;

  const lines = [
    `Today: ${facts.today} (${WEEKDAYS[weekdayOf(facts.today)]}). Money is before tax, in ${currencySymbol}. Saturday is Nepal's weekly day off.`,
    "",
    "Upcoming festivals and holidays (id · name · dates · length · when · who observes):",
    ...facts.upcoming.map(
      (e) =>
        `- ${e.id} · ${e.label} · ${e.start}${e.end !== e.start ? ` to ${e.end}` : ""} (${e.bsLabel}) · ${e.days} day${e.days === 1 ? "" : "s"} · ${when(e)} · ${who(e)}`,
    ),
    "",
  ];

  if (facts.weekdays.length > 0) {
    lines.push(
      `This business by weekday (last ${WEEKDAY_WEEKS} weeks, average per day, holidays left out):`,
      ...facts.weekdays.map(
        (d) => `- ${d.day}: ${money(d.revenue)}, ${d.orders} orders`,
      ),
    );
    // "Rs 0 (-100%)" reads as a terrible day; a shop that sold nothing all
    // day was far more likely shut. Said in those words, so the advice is
    // about opening hours rather than about a collapse in demand.
    if (facts.weekdays[6]?.revenue === 0) {
      lines.push(
        "No sales recorded on Saturdays: the business may close on its day off.",
      );
    } else if (facts.saturdayVsOtherDaysPct !== null) {
      lines.push(
        `Saturday against the other days: ${signedPct(facts.saturdayVsOtherDaysPct)}.`,
      );
    }
  } else {
    lines.push(
      `No sales in the last ${WEEKDAY_WEEKS} weeks to show a weekly pattern.`,
    );
  }
  lines.push("");

  if (facts.pastHolidays.length > 0) {
    lines.push(
      "Past holidays this year (average sales per day vs the same weekday in the weeks before):",
      ...facts.pastHolidays.map((h) => {
        const when = `${h.label} (${h.start}${h.days > 1 ? `, ${h.days} days` : ""})`;
        return h.revenue === 0
          ? `- ${when}: no sales recorded, usual ${money(h.usual)}`
          : `- ${when}: ${money(h.revenue)} vs usual ${money(h.usual)}${h.changePct !== null ? ` (${signedPct(h.changePct)})` : ""}`;
      }),
    );
    if (facts.pastHolidays.every((h) => h.revenue === 0)) {
      lines.push(
        "No sales were recorded on any past holiday this year: the business may close on public holidays.",
      );
    } else if (facts.pastHolidaysPct !== null) {
      lines.push(
        `All past holidays together: ${signedPct(facts.pastHolidaysPct)} against usual days.`,
      );
    }
  } else {
    lines.push("Not enough sales history to compare past holidays.");
  }
  lines.push("");

  lines.push(
    "Best sellers, last 30 days (possible items to stock up on):",
    ...(facts.bestSellers.length > 0
      ? facts.bestSellers.map(
          (b) =>
            `- ${b.name}${b.category ? ` [${b.category}]` : ""}: ${whole(b.units)} sold, price ${money(b.price)}`,
        )
      : ["- none"]),
  );

  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const FESTIVAL_PREP_PROMPT = `You help the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS prepare for upcoming festivals and public holidays. You receive the dates from Nepal's official holiday calendar and facts about how this business trades.

For each upcoming event worth preparing for, write:
- eventId: the event's id exactly as given.
- description: what this business should expect and how to prepare, in one or two sentences, under 240 characters.
- stockUp: up to 4 best sellers to have more of, each written exactly as in the facts. An empty list when none fit.
- offerIdea: one short offer idea for the event, under 90 characters.

Rules:
- Base expectations on this business's own facts: how it sold on past holidays and on Saturdays. When those show sales falling, suggest preparing less instead of assuming a rush. When no sales were recorded, the business was probably closed: treat it as a question of whether to open, and what opening would take, not as a collapse in demand.
- Make each note specific to its event: how long it lasts, what people do during it, whether it runs into another event. Mention the business's holiday history in a few words at most, and do not repeat the same sentence on every event.
- You may use common knowledge of how people in Nepal mark each festival — family meals, sweets, gifts, travel home, fasting — but do not present it as this business's data.
- Never invent sales figures, percentages or forecasts. Only quote figures that appear in the facts.
- Never give dates; the app shows them.
- Leave out an event when there is nothing useful to say.
- Plain words for a busy owner. No markdown, no emojis.`;

export const FESTIVAL_PREP_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          description: { type: "string" },
          stockUp: { type: "array", items: { type: "string" } },
          offerIdea: { type: "string" },
        },
        required: ["eventId", "description", "stockUp", "offerIdea"],
      },
    },
  },
  required: ["events"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface FestivalPrep {
  /** Stable per event, so a dismissal survives a refresh. */
  id: string;
  label: string;
  icon: string;
  startDate: string;
  endDate: string;
  bsLabel: string;
  scope: HolidayEvent["scope"];
  note?: string;
  /** The offer builder's id, when the event is one it offers. */
  festivalId?: string;
  description: string;
  /** Real menu items, checked against the menu. */
  stockUp: string[];
  offerIdea: string | null;
}

const MAX_STOCK_UP = 4;

/**
 * The model's notes joined onto the calendar.
 *
 * Dates, names and icons come from the calendar entry the id names; an id the
 * calendar did not send is dropped. Cards keep the calendar's order, whatever
 * order the model answered in.
 */
export function parseFestivalPrep(
  value: unknown,
  upcoming: UpcomingEvent[],
  menu: MenuProduct[],
): FestivalPrep[] {
  const list = (value as { events?: unknown } | null)?.events;
  if (!Array.isArray(list)) return [];

  const match = productMatcher(menu.filter((p) => p.isAvailable));
  const notes = new Map<
    string,
    { description: string; stockUp: string[]; offerIdea: string | null }
  >();

  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const id = typeof e.eventId === "string" ? e.eventId.trim() : "";
    if (!id || notes.has(id)) continue;
    const description = textOr(e.description, 320);
    if (!description) continue;

    const stockUp: string[] = [];
    for (const name of Array.isArray(e.stockUp) ? e.stockUp : []) {
      const product = typeof name === "string" ? match(name) : null;
      if (product && !stockUp.includes(product.name))
        stockUp.push(product.name);
      if (stockUp.length >= MAX_STOCK_UP) break;
    }

    notes.set(id, {
      description,
      stockUp,
      offerIdea: textOr(e.offerIdea, 120),
    });
  }

  return upcoming.flatMap((event) => {
    const note = notes.get(event.id);
    if (!note) return [];
    return [
      {
        id: `festival-${event.id}`,
        label: event.label,
        icon: event.icon,
        startDate: event.start,
        endDate: event.end,
        bsLabel: event.bsLabel,
        scope: event.scope,
        note: event.note,
        festivalId: event.festivalId,
        ...note,
      },
    ];
  });
}

export type FestivalPrepResult = AiSectionResult<FestivalPrep>;
