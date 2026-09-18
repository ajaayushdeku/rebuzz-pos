/**
 * Hour-by-Hour Playbook on the AI Insights page.
 *
 * Built from every bill in the last four weeks, which the POS report returns
 * with its time, total, tax and discount. That supports orders, sales and
 * spend per order for each hour of the day. It does not support three things
 * the sample card showed, so they are not asked for:
 *
 * - Floor occupancy. Bills rarely name a table and never say when it was
 *   taken, so "70% full" cannot be measured. Busyness is shown instead: an
 *   hour's orders against the busiest hour's.
 * - Spend per head. There is no guest count; spend per order is used.
 * - What sells in a given hour. Bills in the report carry no items, so a tip
 *   can name the business's best sellers, but not claim one sells at 3pm.
 *
 * The app picks the hours worth a card — the busiest, the quietest while open,
 * the one where people spend least — and the model only writes the play.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import { buildMenuFacts, type MenuLine } from "./menuSuggestions";
import {
  formatMoney,
  shiftIsoDate,
  textOr,
  whole,
  type AiSectionResult,
  type MenuProduct,
  type SalesByItemRow,
  type SalesWindows,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const HOUR_PLAYBOOK_VERSION = "v1";

/** Four whole weeks, so every weekday counts the same number of times. */
export const HOUR_WINDOW_DAYS = 28;

/** Fewer than this and an hourly pattern is noise. */
const MIN_ORDERS = 20;
const MIN_TRADING_DAYS = 7;
/** A "low spend" hour must be at least this much under the day's average. */
const LOW_SPEND_GAP_PCT = 20;
/** …and busy enough to matter: this share of the busiest hour's orders. */
const LOW_SPEND_MIN_BUSYNESS = 40;

/** An hour counts as open when it has orders on this share of trading days. */
const OPEN_HOUR_SHARE = 0.1;

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/** One bill from `/business/report`'s `allBills`. */
export interface ReportBill {
  createdAt?: string;
  grandTotal?: number;
  taxamt?: number;
  discount?: number;
  isRefunded?: boolean;
}

/** The last four whole days before today, as a date window. */
export function hourWindow(today: string) {
  return {
    startDate: shiftIsoDate(today, -HOUR_WINDOW_DAYS),
    endDate: shiftIsoDate(today, -1),
  };
}

/** "3–4pm", "11am–12pm". */
export function hourLabel(hour: number): string {
  const part = (h: number) => {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { h12, suffix: h % 24 < 12 ? "am" : "pm" };
  };
  const a = part(hour);
  const b = part(hour + 1);
  return a.suffix === b.suffix
    ? `${a.h12}–${b.h12}${b.suffix}`
    : `${a.h12}${a.suffix}–${b.h12}${b.suffix}`;
}

// ── Facts ─────────────────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** "1.2", or "under 0.1" when an hour's orders are too rare to round up. */
export function ordersLabel(perDay: number): string {
  return perDay === 0 ? "under 0.1" : String(perDay);
}

export interface HourStats {
  hour: number;
  /**
   * Average orders a day, over the days the business traded. Counting the
   * days it was shut would make a shop open three days a week look a third
   * as busy as it is in every hour it is open.
   */
  ordersPerDay: number;
  /** Average orders on a Saturday, over the Saturdays it traded. */
  saturdayOrders: number;
  /** Average sales a trading day, before tax. */
  salesPerDay: number;
  /**
   * The typical order before tax — the middle one, not the mean. One large
   * bill (a catering order, a test sale) would otherwise lift the mean of its
   * hour and of the whole day, and every other hour would look like a
   * low-spend hour beside it.
   */
  avgOrder: number | null;
  /** Orders against the busiest hour, 0–100. */
  busynessPct: number;
  /** Discount as a share of what the orders would have cost without it. */
  discountPct: number;
}

export type SlotKind = "peak" | "quiet" | "low-spend";

export interface HourSlot extends HourStats {
  ref: string;
  kind: SlotKind;
}

export interface HourFacts {
  windowStart: string;
  windowEnd: string;
  totalOrders: number;
  tradingDays: number;
  /** First and last hour with any orders. */
  opens: number | null;
  closes: number | null;
  /** The typical order across the whole window, before tax. */
  avgOrder: number | null;
  /** Every hour between opening and closing, quiet ones included. */
  hours: HourStats[];
  slots: HourSlot[];
  bestSellers: MenuLine[];
  /** Enough orders over enough days to read a pattern. */
  enoughData: boolean;
}

export function buildHourFacts(
  today: string,
  bills: ReportBill[],
  menu: MenuProduct[],
  salesRows: SalesByItemRow[],
  windows: SalesWindows,
): HourFacts {
  const { startDate, endDate } = hourWindow(today);

  const sums = Array.from({ length: 24 }, () => ({
    orders: 0,
    saturdayOrders: 0,
    sales: 0,
    discount: 0,
    values: [] as number[],
  }));
  const tradingDays = new Set<string>();
  const tradingSaturdays = new Set<string>();
  const allValues: number[] = [];

  let totalOrders = 0;
  for (const bill of bills) {
    if (bill.isRefunded || !bill.createdAt) continue;
    const instant = new Date(bill.createdAt).getTime();
    if (Number.isNaN(instant)) continue;

    // `createdAt` is a true UTC instant; shifted, its UTC parts read as Nepal
    // wall-clock time, whatever zone the server runs in.
    const nepal = new Date(instant + NEPAL_OFFSET_MS);
    const date = nepal.toISOString().slice(0, 10);
    if (date < startDate || date > endDate) continue;

    const s = sums[nepal.getUTCHours()];
    const sales = (bill.grandTotal ?? 0) - (bill.taxamt ?? 0);
    s.orders += 1;
    s.sales += sales;
    s.discount += bill.discount ?? 0;
    s.values.push(sales);
    if (nepal.getUTCDay() === 6) {
      s.saturdayOrders += 1;
      tradingSaturdays.add(date);
    }

    tradingDays.add(date);
    allValues.push(sales);
    totalOrders += 1;
  }

  const days = Math.max(1, tradingDays.size);

  // Opening hours are the hours with orders on at least one trading day in
  // ten. One stray bill — a 5:50am test sale, a late tab closed after hours —
  // would otherwise stretch the day, and the hours between it and real
  // opening would be named "the quietest hour" when the shop is simply shut.
  const regular = Math.max(1, days * OPEN_HOUR_SHARE);
  const open = sums
    .map((s, hour) => ({ s, hour }))
    .filter(({ s }) => s.orders >= regular);
  const opens = open.length > 0 ? open[0].hour : null;
  const closes = open.length > 0 ? open[open.length - 1].hour : null;
  const peakOrders = Math.max(0, ...sums.map((s) => s.orders));
  const round1 = (v: number) => Math.round(v * 10) / 10;

  const hours: HourStats[] =
    opens === null || closes === null
      ? []
      : sums.slice(opens, closes + 1).map((s, i) => ({
          hour: opens + i,
          ordersPerDay: round1(s.orders / days),
          saturdayOrders:
            tradingSaturdays.size > 0
              ? round1(s.saturdayOrders / tradingSaturdays.size)
              : 0,
          salesPerDay: s.sales / days,
          avgOrder: median(s.values),
          busynessPct:
            peakOrders > 0 ? Math.round((s.orders / peakOrders) * 100) : 0,
          discountPct:
            s.sales + s.discount > 0
              ? round1((s.discount / (s.sales + s.discount)) * 100)
              : 0,
        }));

  const avgOrder = median(allValues);
  const enoughData =
    totalOrders >= MIN_ORDERS && tradingDays.size >= MIN_TRADING_DAYS;

  // ── The hours worth a card ──
  const slots: HourSlot[] = [];
  const add = (stats: HourStats | undefined, kind: SlotKind) => {
    if (!stats || slots.some((s) => s.hour === stats.hour)) return;
    // From the hour, so the same hour keeps the same ref all day.
    slots.push({ ...stats, kind, ref: `h${stats.hour}` });
  };

  if (enoughData && hours.length > 0) {
    add([...hours].sort((a, b) => b.ordersPerDay - a.ordersPerDay)[0], "peak");

    // Quietest while open. The first and last hour are left out: every day
    // starts and ends slowly, and "your opening hour is quiet" is not news.
    const inner = hours.slice(1, -1);
    if (inner.length > 0) {
      add(
        [...inner].sort((a, b) => a.ordersPerDay - b.ordersPerDay)[0],
        "quiet",
      );
    }

    if (avgOrder !== null) {
      const lowSpend = hours
        .filter(
          (h) =>
            h.avgOrder !== null &&
            h.busynessPct >= LOW_SPEND_MIN_BUSYNESS &&
            h.avgOrder <= avgOrder * (1 - LOW_SPEND_GAP_PCT / 100),
        )
        .sort((a, b) => (a.avgOrder ?? 0) - (b.avgOrder ?? 0))[0];
      add(lowSpend, "low-spend");
    }
  }

  return {
    windowStart: startDate,
    windowEnd: endDate,
    totalOrders,
    tradingDays: tradingDays.size,
    opens,
    closes,
    avgOrder,
    hours,
    slots: slots.sort((a, b) => a.hour - b.hour),
    bestSellers: buildMenuFacts(menu, salesRows, windows).bestSellers,
    enoughData,
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

const SLOT_WORDS: Record<SlotKind, string> = {
  peak: "busiest hour",
  quiet: "quietest hour while open",
  "low-spend": "busy, but people spend least per order",
};

export function hourBriefing(facts: HourFacts, currencySymbol: string): string {
  const money = (value: number) => formatMoney(currencySymbol, value);

  const lines = [
    `Window: ${facts.windowStart} to ${facts.windowEnd}, ${HOUR_WINDOW_DAYS} days. Times are Nepal time. Money is before tax, in ${currencySymbol}.`,
    `${whole(facts.totalOrders)} orders on ${facts.tradingDays} trading days (days with any sale; the averages below are per trading day). Typical order ${facts.avgOrder === null ? "unknown" : money(facts.avgOrder)} (the middle order, so one large bill does not skew it).`,
    `Orders come in from ${facts.opens === null ? "?" : hourLabel(facts.opens)} to ${facts.closes === null ? "?" : hourLabel(facts.closes)}.`,
    "No data on seats, guests per order, staff on shift or which items sell in which hour.",
    "",
    "Every hour (orders a day · orders on a Saturday · sales a day · typical order · busyness vs busiest hour · discount):",
    ...facts.hours.map(
      (h) =>
        `- ${hourLabel(h.hour)}: ${h.avgOrder === null ? "0" : ordersLabel(h.ordersPerDay)} · ${h.saturdayOrders} · ${money(h.salesPerDay)} · ${h.avgOrder === null ? "no orders" : money(h.avgOrder)} · ${h.busynessPct}% · ${h.discountPct}% off`,
    ),
    "",
    "Hours to write a play for (ref · hour · why the app picked it):",
    ...facts.slots.map(
      (s) => `- ${s.ref} · ${hourLabel(s.hour)} · ${SLOT_WORDS[s.kind]}`,
    ),
    "",
    "Best sellers, last 30 days (items a play may feature):",
    ...(facts.bestSellers.length > 0
      ? facts.bestSellers.map(
          (b) => `- ${b.name}: ${whole(b.units)} sold, price ${money(b.price)}`,
        )
      : ["- none"]),
  ];
  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const HOUR_PLAYBOOK_PROMPT = `You advise the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS on how to run each part of the day. You receive orders and sales for every hour over the last four weeks, and the hours the app picked for a play.

For each picked hour, write:
- ref: the hour's ref exactly as given, e.g. h15.
- title: a short name for what is going on in that hour, under 30 characters, e.g. "Quietest hour" or "Busy but small orders".
- description: what the numbers show, in one sentence under 140 characters, quoting only figures from the facts.
- tip: what to do in that hour, in one or two sentences under 220 characters.

Rules:
- Busiest hour: help serve it faster and raise spend per order without slowing service; do not suggest discounts that pull in more people.
- Quietest hour: bring people in or use the time well (prep, a limited offer, a combo).
- Low spend hour: raise spend per order, such as suggesting an add-on or a combo.
- You may name best sellers exactly as written in the facts, but never claim an item sells at a particular hour: the facts do not say.
- The facts have no seat counts, guest numbers or staff rosters. Do not mention occupancy, people per table or staff numbers.
- Never invent figures or forecasts.
- Plain words for a busy owner. No markdown, no emojis.`;

export const HOUR_PLAYBOOK_SCHEMA = {
  type: "object",
  properties: {
    hours: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          tip: { type: "string" },
        },
        required: ["ref", "title", "description", "tip"],
      },
    },
  },
  required: ["hours"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface HourInsight {
  /** Stable per hour, so a dismissal survives a refresh. */
  id: string;
  hour: number;
  /** "3–4pm". */
  time: string;
  kind: SlotKind;
  title: string;
  busynessPct: number;
  ordersPerDay: number;
  avgOrder: number | null;
  description: string;
  tip: string;
}

/**
 * The model's plays joined onto the app's hours.
 *
 * The hour, its busyness and its figures come from the facts; a ref the app
 * did not send is dropped. Cards keep the order of the day.
 */
export function parseHourPlaybook(
  value: unknown,
  facts: HourFacts,
): HourInsight[] {
  const list = (value as { hours?: unknown } | null)?.hours;
  if (!Array.isArray(list)) return [];

  const plays = new Map<
    string,
    { title: string; description: string; tip: string }
  >();
  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof e.ref === "string" ? e.ref.trim() : "";
    if (!ref || plays.has(ref)) continue;
    const title = textOr(e.title, 40);
    const description = textOr(e.description, 220);
    const tip = textOr(e.tip, 320);
    if (!title || !description || !tip) continue;
    plays.set(ref, { title, description, tip });
  }

  return facts.slots.flatMap((slot) => {
    const play = plays.get(slot.ref);
    if (!play) return [];
    return [
      {
        id: `hour-${slot.hour}`,
        hour: slot.hour,
        time: hourLabel(slot.hour),
        kind: slot.kind,
        busynessPct: slot.busynessPct,
        ordersPerDay: slot.ordersPerDay,
        avgOrder: slot.avgOrder,
        ...play,
      },
    ];
  });
}

export type HourPlaybookResult = AiSectionResult<HourInsight>;
