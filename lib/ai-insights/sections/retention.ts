/**
 * Customer Retention Radar on the AI Insights page.
 *
 * Who is going quiet is judged against each customer's own habit, not a fixed
 * number of days: a regular who comes every three days is overdue after ten,
 * one who comes monthly is not. The app works that out from the last four
 * months of bills; the model only writes what to do and a message to send.
 *
 * Privacy: the model never sees a customer's name, phone or email. Each one is
 * "c" plus a short code, and the app puts the name back when it builds the
 * card. The message the model drafts uses a {name} placeholder for the same
 * reason.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import {
  formatMoney,
  putNamesBack,
  shiftIsoDate,
  textOr,
  whole,
  type AiSectionResult,
  type DateWindow,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const RETENTION_VERSION = "v2";

/** How far back visits are read. */
export const RETENTION_LOOKBACK_DAYS = 120;

/** Visits needed before a customer has a habit to judge against. */
const MIN_VISITS = 3;
/** Quiet this many times their usual gap, and at least this long: cooling off. */
const COOLING_RATIO = 1.75;
const COOLING_MIN_DAYS = 7;
/** Quiet this many times their usual gap, and at least this long: at risk. */
const AT_RISK_RATIO = 3;
const AT_RISK_MIN_DAYS = 14;
const MAX_CUSTOMERS = 6;

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

export function retentionWindow(today: string): DateWindow {
  return {
    startDate: shiftIsoDate(today, -RETENTION_LOOKBACK_DAYS),
    endDate: today,
  };
}

// ── Inputs ────────────────────────────────────────────────────────────────

/** A customer from `/business/users/roles/user`. */
export interface CustomerRecord {
  _id?: string;
  name?: string;
  phone?: string;
  /** e.g. "NP +977". */
  countryCode?: string;
  loyaltyPoint?: number;
  isEmployee?: boolean;
  isDeactivated?: boolean;
}

/** A bill from `/business/report`'s `allBills`, as retention reads it. */
export interface CustomerBill {
  customerId?: string | null;
  createdAt?: string;
  grandTotal?: number;
  isRefunded?: boolean;
}

/** One purchase from `/business/users/:id/history`, with its items. */
export interface HistoryPurchase {
  isRefunded?: boolean;
  items?: { productName?: string; quantity?: number }[];
}

// ── Facts ─────────────────────────────────────────────────────────────────

export type RetentionStatus = "At risk" | "Cooling off";

export interface RetentionCandidate {
  /** Sent to the model instead of the customer's name. */
  ref: string;
  customerId: string;
  name: string;
  /** Digits to message, with the country code, or null without a phone. */
  phone: string | null;
  status: RetentionStatus;
  visits: number;
  firstVisit: string;
  lastVisit: string;
  daysSinceVisit: number;
  /** The usual number of days between their visits. */
  usualGapDays: number;
  /** Middle bill total per visit, what the customer paid. */
  spendPerVisit: number;
  /** What their usual pace is worth a month. */
  monthlyValue: number;
  loyaltyPoints: number;
  /** Filled in after the facts, from their purchase history. */
  usualOrder: string[];
}

const nepalDate = (iso: string) =>
  new Date(new Date(iso).getTime() + NEPAL_OFFSET_MS)
    .toISOString()
    .slice(0, 10);

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stableRef(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `c${h.toString(36).slice(0, 6)}`;
}

/**
 * "9779841234567" from "NP +977" and "9841234567", for a WhatsApp link.
 * Null without a phone, or when the number is too short to be one.
 */
export function phoneDigits(
  countryCode?: string,
  phone?: string,
): string | null {
  const local = (phone ?? "").replace(/\D/g, "");
  if (local.length < 7) return null;
  const code = (countryCode ?? "").replace(/\D/g, "");
  return code && !local.startsWith(code) ? `${code}${local}` : local;
}

/** Walk-in placeholders are not people to win back. */
const isPlaceholder = (name: string) =>
  /^(guest|walk[\s-]?in|cash)\b/i.test(name);

export function buildRetentionFacts(
  today: string,
  customers: CustomerRecord[],
  bills: CustomerBill[],
): RetentionCandidate[] {
  const people = new Map(
    customers
      .filter((c) => c._id && c.name && !c.isEmployee && !c.isDeactivated)
      .filter((c) => !isPlaceholder(c.name ?? ""))
      .map((c) => [String(c._id), c]),
  );

  // Spend per visit day: two bills on the same day are one visit.
  const visits = new Map<string, Map<string, number>>();
  for (const bill of bills) {
    if (bill.isRefunded || !bill.customerId || !bill.createdAt) continue;
    if (!people.has(bill.customerId)) continue;
    const day = nepalDate(bill.createdAt);
    const byDay = visits.get(bill.customerId) ?? new Map<string, number>();
    byDay.set(day, (byDay.get(day) ?? 0) + (bill.grandTotal ?? 0));
    visits.set(bill.customerId, byDay);
  }

  const candidates: RetentionCandidate[] = [];
  for (const [id, byDay] of visits) {
    const days = [...byDay.keys()].sort();
    if (days.length < MIN_VISITS) continue;

    const gaps = days.slice(1).map((d, i) => daysBetween(days[i], d));
    const usualGapDays = Math.max(1, Math.round(median(gaps)));
    const lastVisit = days[days.length - 1];
    const daysSinceVisit = daysBetween(lastVisit, today);
    const ratio = daysSinceVisit / usualGapDays;

    const status: RetentionStatus | null =
      daysSinceVisit >= AT_RISK_MIN_DAYS && ratio >= AT_RISK_RATIO
        ? "At risk"
        : daysSinceVisit >= COOLING_MIN_DAYS && ratio >= COOLING_RATIO
          ? "Cooling off"
          : null;
    if (!status) continue;

    const person = people.get(id)!;
    const spendPerVisit = Math.round(median([...byDay.values()]));
    candidates.push({
      ref: stableRef(id),
      customerId: id,
      name: (person.name ?? "").trim(),
      phone: phoneDigits(person.countryCode, person.phone),
      status,
      visits: days.length,
      firstVisit: days[0],
      lastVisit,
      daysSinceVisit,
      usualGapDays,
      spendPerVisit,
      monthlyValue: Math.round(spendPerVisit * (30 / usualGapDays)),
      loyaltyPoints: Math.round(person.loyaltyPoint ?? 0),
      usualOrder: [],
    });
  }

  // At risk before cooling off; within each, the most valuable habit first.
  return candidates
    .sort(
      (a, b) =>
        (a.status === b.status ? 0 : a.status === "At risk" ? -1 : 1) ||
        b.monthlyValue - a.monthlyValue,
    )
    .slice(0, MAX_CUSTOMERS);
}

/** The two items a customer buys most, from their purchase history. */
export function usualOrderFrom(purchases: HistoryPurchase[]): string[] {
  const counts = new Map<string, number>();
  for (const p of purchases) {
    if (p.isRefunded) continue;
    for (const item of p.items ?? []) {
      const name = (item.productName ?? "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + (item.quantity ?? 1));
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);
}

/** "Every 4 days", "Weekly", "2x a week", "Monthly". */
export function paceLabel(usualGapDays: number): string {
  if (usualGapDays <= 1) return "Daily";
  if (usualGapDays <= 3) return `${Math.round(7 / usualGapDays)}x a week`;
  if (usualGapDays >= 6 && usualGapDays <= 8) return "Weekly";
  if (usualGapDays >= 25 && usualGapDays <= 35) return "Monthly";
  return `Every ${usualGapDays} days`;
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function retentionBriefing(
  candidates: RetentionCandidate[],
  today: string,
  currencySymbol: string,
): string {
  const money = (value: number) => formatMoney(currencySymbol, value);
  return [
    `Today: ${today}. Visits read from the last ${RETENTION_LOOKBACK_DAYS} days. Money is what customers paid, in ${currencySymbol}.`,
    "Customers are named by ref only; write {name} wherever the customer's name belongs.",
    "",
    "Customers going quiet (ref · status · habit · last visit · spend · usual order · points):",
    ...candidates.map((c) =>
      [
        `- ${c.ref}`,
        c.status.toLowerCase(),
        `${c.visits} visits since ${c.firstVisit}, usually every ${c.usualGapDays} day${c.usualGapDays === 1 ? "" : "s"}`,
        `last visit ${c.daysSinceVisit} days ago (${Math.round((c.daysSinceVisit / c.usualGapDays) * 10) / 10} times their usual gap)`,
        `${money(c.spendPerVisit)} a visit, about ${money(c.monthlyValue)} a month at their usual pace`,
        c.usualOrder.length > 0
          ? `usually orders ${c.usualOrder.join(" and ")}`
          : "usual order unknown",
        `${whole(c.loyaltyPoints)} loyalty points`,
      ].join(" · "),
    ),
  ].join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const RETENTION_PROMPT = `You help the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS win back regular customers who have gone quiet. For each customer you receive their habit, how overdue they are, what they spend and what they usually order.

For each customer, write:
- ref: the customer's ref exactly as given.
- tip: what the owner should do, in one or two sentences under 200 characters. A small, specific gesture works best: their usual order, their loyalty points, a reason to come back this week.
- message: a short, warm message the owner could send them, under 220 characters, starting with "Hi {name}". Friendly and personal, not salesy. Mention their usual order or points when you have them.

Rules:
- Write {name} for the customer's name. Never write a ref such as cyaxai4 in the tip or message, and never invent a name.
- Never invent figures, prices or discounts that are not in the facts. An offer may be described without a number ("a free drink with your next visit").
- A customer at risk needs a stronger reason to return than one cooling off.
- Plain words. No markdown, no emojis in the tip. At most one emoji in the message.`;

export const RETENTION_SCHEMA = {
  type: "object",
  properties: {
    customers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          tip: { type: "string" },
          message: { type: "string" },
        },
        required: ["ref", "tip", "message"],
      },
    },
  },
  required: ["customers"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface RetentionInsight {
  /** Stable per customer, so a dismissal survives a refresh. */
  id: string;
  name: string;
  status: RetentionStatus;
  /** "2x a week · 18 visits". */
  profile: string;
  daysSinceVisit: number;
  usualGapDays: number;
  spendPerVisit: number;
  monthlyValue: number;
  loyaltyPoints: number;
  usualOrder: string[];
  tip: string;
  /** The model's message with the customer's first name put in. */
  message: string;
  /** For a WhatsApp link, when the customer has a phone number. */
  phone: string | null;
}

/**
 * The model's notes joined onto the customers, names put back.
 *
 * A ref the app did not send is dropped. `{name}` becomes the customer's
 * first name; a message the model wrote without the placeholder is kept as it
 * is, since it names nobody.
 */
export function parseRetention(
  value: unknown,
  candidates: RetentionCandidate[],
): RetentionInsight[] {
  const list = (value as { customers?: unknown } | null)?.customers;
  if (!Array.isArray(list)) return [];

  const notes = new Map<string, { tip: string; message: string }>();
  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof e.ref === "string" ? e.ref.trim() : "";
    const tip = textOr(e.tip, 300);
    const message = textOr(e.message, 320);
    if (ref && tip && message && !notes.has(ref))
      notes.set(ref, { tip, message });
  }

  // Each customer's code with their first name, so one the model copied into
  // its text is replaced too — not only the {name} it was asked to write.
  const firstNameOf = (c: RetentionCandidate) =>
    c.name.split(/\s+/)[0] || c.name;
  const byCode = new Map(candidates.map((c) => [c.ref, firstNameOf(c)]));

  return candidates.flatMap((c) => {
    const note = notes.get(c.ref);
    if (!note) return [];
    const firstName = firstNameOf(c);
    return [
      {
        id: `retention-${c.ref}`,
        name: c.name,
        status: c.status,
        profile: `${paceLabel(c.usualGapDays)} · ${c.visits} visits`,
        daysSinceVisit: c.daysSinceVisit,
        usualGapDays: c.usualGapDays,
        spendPerVisit: c.spendPerVisit,
        monthlyValue: c.monthlyValue,
        loyaltyPoints: c.loyaltyPoints,
        usualOrder: c.usualOrder,
        tip: putNamesBack(note.tip, firstName, byCode),
        message: putNamesBack(note.message, firstName, byCode),
        phone: c.phone,
      },
    ];
  });
}

export type RetentionResult = AiSectionResult<RetentionInsight>;
