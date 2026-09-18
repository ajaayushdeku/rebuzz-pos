/**
 * Staffing Recommendations on the AI Insights page.
 *
 * What the POS can tell about staffing, and what it cannot:
 *
 * - Every bill records who rang it up. So the app knows, for each hour of the
 *   day, how many orders came in and how many different people took them —
 *   and, for each person, how many orders they handle and what they sell.
 * - Its "shifts" are cash-drawer sessions, not attendance (one ran 243 hours),
 *   and there are no wages or roles. So nothing here says who was on the
 *   floor, in the kitchen, or what an hour of staff time cost.
 *
 * Every card is therefore about order-taking at the till, and says so. The
 * app finds the hours and people worth a card; the model writes the advice.
 * Staff names never reach the model: each person is "s" plus a short code,
 * and the app puts the name back.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import { hourLabel } from "./hourPlaybook";
import {
  formatMoney,
  putNamesBack,
  shiftIsoDate,
  textOr,
  type AiSectionResult,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const STAFFING_VERSION = "v2";

/** Four whole weeks, ending yesterday. */
export const STAFFING_WINDOW_DAYS = 28;

const MIN_ORDERS = 20;
const MIN_TRADING_DAYS = 7;
/** A person taking this share of all orders is one the business leans on. */
const KEY_PERSON_SHARE_PCT = 70;
/** A stretched hour needs at least this many orders on a trading day. */
const MIN_STRETCHED_ORDERS_PER_DAY = 1;
/** A person whose typical order is this much below the team's. */
const LOW_SPEND_GAP_PCT = 25;
const MIN_STAFF_ORDERS = 5;

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

export function staffingWindow(today: string) {
  return {
    startDate: shiftIsoDate(today, -STAFFING_WINDOW_DAYS),
    endDate: shiftIsoDate(today, -1),
  };
}

// ── Inputs ────────────────────────────────────────────────────────────────

/** A bill from `/business/report`'s `allBills`, as staffing reads it. */
export interface StaffBill {
  generatedById?: string | null;
  generatedBy?: string | null;
  createdAt?: string;
  grandTotal?: number;
  taxamt?: number;
  isRefunded?: boolean;
}

/** A person on the staff list, from `/business/users/roles/employee`. */
export interface EmployeeRecord {
  _id?: string;
  name?: string;
  isDeactivated?: boolean;
}

// ── Facts ─────────────────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

function stableRef(prefix: string, id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${prefix}${h.toString(36).slice(0, 6)}`;
}

export interface HourStaffing {
  hour: number;
  /** Average orders in this hour, per trading day. */
  ordersPerDay: number;
  /** Average number of different people taking orders, on days it had any. */
  staffTaking: number;
  /** Orders per person taking orders, in this hour. */
  ordersPerPerson: number;
  /** The most orders this hour had on a single day. */
  busiestDay: number;
  /** Who took most of this hour's orders. */
  mainTakerId: string | null;
  mainTakerSharePct: number;
}

export interface PersonStaffing {
  id: string;
  name: string;
  orders: number;
  sharePct: number;
  /** Different day-hours they took orders in. */
  activeHours: number;
  ordersPerActiveHour: number;
  typicalOrder: number | null;
  busiestHour: number | null;
  /** On the staff list, so their page can be opened. */
  onStaffList: boolean;
}

export type StaffingKind =
  | "stretched-hour"
  | "spare-hour"
  | "key-person"
  | "top-performer"
  | "low-spend";

export interface StaffingCandidate {
  ref: string;
  kind: StaffingKind;
  hour?: HourStaffing;
  person?: PersonStaffing;
}

export interface StaffingFacts {
  totalOrders: number;
  tradingDays: number;
  teamTypicalOrder: number | null;
  hours: HourStaffing[];
  people: PersonStaffing[];
  /** On the staff list but took no orders in the window. */
  notTakingOrders: number;
  staffListSize: number;
  candidates: StaffingCandidate[];
  enoughData: boolean;
}

export function buildStaffingFacts(
  today: string,
  bills: StaffBill[],
  employees: EmployeeRecord[],
): StaffingFacts {
  const { startDate, endDate } = staffingWindow(today);
  const roster = employees.filter((e) => e._id && !e.isDeactivated);
  const onList = new Set(roster.map((e) => String(e._id)));

  // (date, hour) → orders per person.
  const slots = new Map<string, Map<string, number>>();
  const names = new Map<string, string>();
  const values = new Map<string, number[]>();
  const allValues: number[] = [];
  const tradingDays = new Set<string>();
  let totalOrders = 0;

  for (const bill of bills) {
    if (bill.isRefunded || !bill.createdAt || !bill.generatedById) continue;
    const t = new Date(bill.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const nepal = new Date(t + NEPAL_OFFSET_MS);
    const date = nepal.toISOString().slice(0, 10);
    if (date < startDate || date > endDate) continue;

    const who = String(bill.generatedById);
    names.set(who, (bill.generatedBy ?? "").trim() || "Unnamed staff");
    const key = `${date}|${nepal.getUTCHours()}`;
    const slot = slots.get(key) ?? new Map<string, number>();
    slot.set(who, (slot.get(who) ?? 0) + 1);
    slots.set(key, slot);

    const sale = (bill.grandTotal ?? 0) - (bill.taxamt ?? 0);
    values.set(who, [...(values.get(who) ?? []), sale]);
    allValues.push(sale);
    tradingDays.add(date);
    totalOrders += 1;
  }

  const days = Math.max(1, tradingDays.size);

  // ── Hours ──
  const byHour = new Map<
    number,
    {
      orders: number;
      staffSum: number;
      slots: number;
      busiest: number;
      by: Map<string, number>;
    }
  >();
  for (const [key, slot] of slots) {
    const hour = Number(key.split("|")[1]);
    const orders = [...slot.values()].reduce((s, n) => s + n, 0);
    const h = byHour.get(hour) ?? {
      orders: 0,
      staffSum: 0,
      slots: 0,
      busiest: 0,
      by: new Map<string, number>(),
    };
    h.orders += orders;
    h.staffSum += slot.size;
    h.slots += 1;
    h.busiest = Math.max(h.busiest, orders);
    for (const [who, n] of slot) h.by.set(who, (h.by.get(who) ?? 0) + n);
    byHour.set(hour, h);
  }
  const hours: HourStaffing[] = [...byHour.entries()]
    .map(([hour, h]) => {
      const main = [...h.by.entries()].sort((a, b) => b[1] - a[1])[0];
      const staffTaking = h.staffSum / h.slots;
      return {
        hour,
        ordersPerDay: round1(h.orders / days),
        staffTaking: round1(staffTaking),
        ordersPerPerson: round1(h.orders / h.staffSum),
        busiestDay: h.busiest,
        mainTakerId: main?.[0] ?? null,
        mainTakerSharePct: main ? Math.round((main[1] / h.orders) * 100) : 0,
      };
    })
    .sort((a, b) => a.hour - b.hour);

  // ── People ──
  const activeHours = new Map<string, number>();
  for (const slot of slots.values()) {
    for (const who of slot.keys()) {
      activeHours.set(who, (activeHours.get(who) ?? 0) + 1);
    }
  }
  const people: PersonStaffing[] = [...values.entries()]
    .map(([id, sales]) => {
      const perHour = hours
        .map((h) => ({ hour: h.hour, n: byHour.get(h.hour)?.by.get(id) ?? 0 }))
        .sort((a, b) => b.n - a.n)[0];
      return {
        id,
        name: names.get(id) ?? "Unnamed staff",
        orders: sales.length,
        sharePct:
          totalOrders > 0 ? Math.round((sales.length / totalOrders) * 100) : 0,
        activeHours: activeHours.get(id) ?? 0,
        ordersPerActiveHour: round1(
          sales.length / Math.max(1, activeHours.get(id) ?? 0),
        ),
        typicalOrder: median(sales),
        busiestHour: perHour && perHour.n > 0 ? perHour.hour : null,
        onStaffList: onList.has(id),
      };
    })
    .sort((a, b) => b.orders - a.orders);

  const teamTypicalOrder = median(allValues);
  const enoughData =
    totalOrders >= MIN_ORDERS && tradingDays.size >= MIN_TRADING_DAYS;

  // ── What is worth a card ──
  const candidates: StaffingCandidate[] = [];
  if (enoughData) {
    // The hour where each person taking orders handles the most.
    const busy = hours.filter(
      (h) => h.ordersPerDay >= MIN_STRETCHED_ORDERS_PER_DAY,
    );
    const stretched = [...(busy.length > 0 ? busy : hours)].sort(
      (a, b) =>
        b.ordersPerPerson - a.ordersPerPerson ||
        b.ordersPerDay - a.ordersPerDay,
    )[0];
    if (stretched) {
      candidates.push({
        ref: `h${stretched.hour}`,
        kind: "stretched-hour",
        hour: stretched,
      });
    }

    // An hour where two or more people were taking orders for very few.
    const spare = hours
      .filter((h) => h.staffTaking >= 1.5 && h.hour !== stretched?.hour)
      .sort((a, b) => a.ordersPerPerson - b.ordersPerPerson)[0];
    if (spare)
      candidates.push({
        ref: `h${spare.hour}`,
        kind: "spare-hour",
        hour: spare,
      });

    const top = people[0];
    if (top && top.sharePct >= KEY_PERSON_SHARE_PCT) {
      candidates.push({
        ref: stableRef("s", top.id),
        kind: "key-person",
        person: top,
      });
    } else if (top && people.length > 1) {
      candidates.push({
        ref: stableRef("s", top.id),
        kind: "top-performer",
        person: top,
      });
    }

    if (teamTypicalOrder !== null && people.length > 1) {
      const low = people
        .filter(
          (p) =>
            p.orders >= MIN_STAFF_ORDERS &&
            p.typicalOrder !== null &&
            p.typicalOrder <= teamTypicalOrder * (1 - LOW_SPEND_GAP_PCT / 100),
        )
        .sort((a, b) => (a.typicalOrder ?? 0) - (b.typicalOrder ?? 0))[0];
      if (low && low.id !== top?.id) {
        candidates.push({
          ref: stableRef("s", low.id),
          kind: "low-spend",
          person: low,
        });
      }
    }
  }

  return {
    totalOrders,
    tradingDays: tradingDays.size,
    teamTypicalOrder,
    hours,
    people,
    notTakingOrders: roster.filter((e) => !values.has(String(e._id))).length,
    staffListSize: roster.length,
    candidates,
    enoughData,
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function staffingBriefing(
  facts: StaffingFacts,
  currencySymbol: string,
): string {
  const money = (v: number) => formatMoney(currencySymbol, v);
  const refFor = new Map(facts.people.map((p) => [p.id, stableRef("s", p.id)]));
  const who = (id: string | null) =>
    id ? (refFor.get(id) ?? "someone") : "nobody";

  const lines = [
    `Last ${STAFFING_WINDOW_DAYS} days: ${facts.totalOrders} orders on ${facts.tradingDays} trading days. Times are Nepal time. Money is before tax, in ${currencySymbol}.`,
    "The only staffing data is who rang up each bill. There is no attendance, kitchen staff, roles or wages. People are named by ref only.",
    `Staff list: ${facts.staffListSize} people; ${facts.notTakingOrders} of them took no orders in this time (they may work elsewhere, such as the kitchen).`,
    facts.teamTypicalOrder !== null
      ? `Typical order across the team: ${money(facts.teamTypicalOrder)}.`
      : "",
    "",
    "People taking orders (ref · orders · share · hours active · orders per active hour · typical order · busiest hour):",
    ...facts.people.map(
      (p) =>
        `- ${refFor.get(p.id)} · ${p.orders} · ${p.sharePct}% · ${p.activeHours} · ${p.ordersPerActiveHour} · ${p.typicalOrder === null ? "?" : money(p.typicalOrder)} · ${p.busiestHour === null ? "?" : hourLabel(p.busiestHour)}`,
    ),
    "",
    "Hours (orders per trading day · people taking orders · orders per person · busiest single day · main order-taker):",
    ...facts.hours.map(
      (h) =>
        `- ${hourLabel(h.hour)}: ${h.ordersPerDay} · ${h.staffTaking} · ${h.ordersPerPerson} · ${h.busiestDay} · ${who(h.mainTakerId)} (${h.mainTakerSharePct}%)`,
    ),
    "",
    "Write a card for each of these (ref · why the app picked it):",
    ...facts.candidates.map((c) => {
      const why: Record<StaffingKind, string> = {
        "stretched-hour":
          "the hour where each person taking orders handles the most",
        "spare-hour": "two or more people taking orders in a quiet hour",
        "key-person": "one person takes most of the business's orders",
        "top-performer": "the person who takes the most orders",
        "low-spend": "a person whose typical order is well below the team's",
      };
      return `- ${c.ref} · ${why[c.kind]}`;
    }),
  ];
  return lines.filter((l) => l !== "").join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const STAFFING_PROMPT = `You advise the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS about staffing at the till. The only data is who rang up each bill: orders per hour, how many different people took them, and each person's orders and typical order value. There is no attendance, kitchen staff, roles or wages.

For each item listed at the end, write:
- ref: exactly as given.
- title: a short heading, under 40 characters, e.g. "One person at the lunch rush".
- description: what the numbers show, one sentence under 160 characters, quoting only figures from the facts.
- tip: what to do, one or two sentences under 220 characters.

Rules:
- Only talk about taking orders and serving at the till. Never claim who was working, who was idle, or what staff cost: the facts cannot show it.
- A stretched hour: suggest a second person on the till or quicker ordering at that time, not in general.
- Two people taking orders in a quiet hour: suggest using the time for prep, cleaning or training, not cutting anyone.
- One person taking most orders: the business depends on them; suggest training someone else to cover.
- Low typical order: suggest coaching on suggesting add-ons, kindly, not as blame.
- Refer to people as "they". Write {name} where the person's name belongs. Never write a ref such as s1332jr in the title, description or tip, and never invent names.
- Never invent figures or forecasts. Plain words. No markdown, no emojis.`;

export const STAFFING_SCHEMA = {
  type: "object",
  properties: {
    items: {
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
  required: ["items"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface StaffingInsight {
  /** Stable per hour or person, so a dismissal survives a refresh. */
  id: string;
  kind: StaffingKind;
  title: string;
  description: string;
  tip: string;
  hour?: HourStaffing & { label: string; mainTakerName: string | null };
  person?: PersonStaffing;
  /** The team's typical order, for comparing a person against it. */
  teamTypicalOrder: number | null;
}

/**
 * The model's notes joined onto the app's facts, names put back.
 *
 * A ref the app did not send is dropped. `{name}`, and any person's code the
 * model copied into its text, become the person's name.
 */
export function parseStaffing(
  value: unknown,
  facts: StaffingFacts,
): StaffingInsight[] {
  const list = (value as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return [];

  const nameOf = new Map(facts.people.map((p) => [p.id, p.name]));
  // Every person's code, so one the model copied into its text is replaced
  // too — not only the {name} it was asked to write.
  const byCode = new Map(
    facts.people.map((p) => [stableRef("s", p.id), p.name]),
  );
  const notes = new Map<
    string,
    { title: string; description: string; tip: string }
  >();
  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof e.ref === "string" ? e.ref.trim() : "";
    const title = textOr(e.title, 60);
    const description = textOr(e.description, 260);
    const tip = textOr(e.tip, 320);
    if (ref && title && description && tip && !notes.has(ref)) {
      notes.set(ref, { title, description, tip });
    }
  }

  return facts.candidates.flatMap((c) => {
    const note = notes.get(c.ref);
    if (!note) return [];
    const name =
      c.person?.name ??
      (c.hour?.mainTakerId ? nameOf.get(c.hour.mainTakerId) : null) ??
      "";
    const fill = (text: string) => putNamesBack(text, name || "they", byCode);
    return [
      {
        id: `staffing-${c.kind}-${c.ref}`,
        kind: c.kind,
        title: fill(note.title),
        description: fill(note.description),
        tip: fill(note.tip),
        hour: c.hour
          ? {
              ...c.hour,
              label: hourLabel(c.hour.hour),
              mainTakerName: c.hour.mainTakerId
                ? (nameOf.get(c.hour.mainTakerId) ?? null)
                : null,
            }
          : undefined,
        person: c.person,
        teamTypicalOrder: facts.teamTypicalOrder,
      },
    ];
  });
}

export type StaffingResult = AiSectionResult<StaffingInsight>;
