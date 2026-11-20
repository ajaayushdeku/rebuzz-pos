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
export const RETENTION_VERSION = "v5";

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
  tip?: string;
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

function selectRepresentativeExamples<T extends { styleId: string }>(
  examples: T[],
  limit: number,
): T[] {
  const selected: T[] = [];
  const selectedStyles = new Set<string>();
  const selectedExamples = new Set<T>();

  // First pass: select the latest example from each distinct style.
  for (const example of examples) {
    if (selected.length >= limit) break;

    if (!selectedStyles.has(example.styleId)) {
      selected.push(example);
      selectedStyles.add(example.styleId);
      selectedExamples.add(example);
    }
  }

  // Second pass: fill remaining slots with the latest examples.
  for (const example of examples) {
    if (selected.length >= limit) break;

    if (!selectedExamples.has(example)) {
      selected.push(example);
      selectedExamples.add(example);
    }
  }

  return selected;
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function retentionBriefing(
  candidates: RetentionCandidate[],
  today: string,
  currencySymbol: string,
  feedback?: RetentionFeedbackPreferences | null,
): string {
  const money = (value: number) => formatMoney(currencySymbol, value);

  const MAX_APPROVED_EXAMPLES = 3;
  const MAX_DISAPPROVED_EXAMPLES = 3;
  const MAX_EXAMPLE_LENGTH = 250;
  const MAX_REASON_LENGTH = 150;

  const approvedExamples = selectRepresentativeExamples(
    feedback?.approvedExamples ?? [],
    MAX_APPROVED_EXAMPLES,
  );

  const disapprovedExamples = selectRepresentativeExamples(
    feedback?.disapprovedExamples ?? [],
    MAX_DISAPPROVED_EXAMPLES,
  );

  const truncate = (value: string, maxLength: number) =>
    value.length > maxLength
      ? `${value.slice(0, maxLength).trimEnd()}...`
      : value;

  // Original customer facts — preserve the existing briefing.
  const customerBriefing = [
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

  // Business-wide administrator feedback.
  const feedbackContext =
    feedback && feedback.totalFeedback.total > 0
      ? [
          "",
          "ADMINISTRATOR WRITING FEEDBACK",
          "The following preferences are based on previous administrator decisions across completed periods.",
          `Total decisions: ${feedback.totalFeedback.total} (${feedback.totalFeedback.approved} approved, ${feedback.totalFeedback.disapproved} disapproved).`,
          "",
          "Styles with more approvals:",
          ...(feedback.preferredStyles.length
            ? feedback.preferredStyles.map(
                (style) =>
                  `- ${style.styleId}: ${style.approved} approved, ${style.disapproved} disapproved`,
              )
            : ["- No consistently preferred styles yet."]),
          "",
          "Styles with more disapprovals:",
          ...(feedback.avoidStyles.length
            ? feedback.avoidStyles.map(
                (style) =>
                  `- ${style.styleId}: ${style.approved} approved, ${style.disapproved} disapproved`,
              )
            : ["- No consistently avoided styles yet."]),
          "",
          "",
          "APPROVED MESSAGE EXAMPLES",
          "These messages were explicitly approved by the administrator.",
          "Learn from their wording, tone, personalization, and structure.",
          "Do not copy them verbatim.",
          ...(approvedExamples.length
            ? approvedExamples.map((example, index) =>
                [
                  `Approved example ${index + 1}:`,
                  `Style: ${example.styleTitle} (${example.styleId})`,
                  `Message: ${truncate(example.message, MAX_EXAMPLE_LENGTH)}`,
                  example.style?.tone ? `Tone: ${example.style.tone}` : null,
                  example.style?.length
                    ? `Length: ${example.style.length}`
                    : null,
                  example.style?.personalization
                    ? `Personalization: ${example.style.personalization}`
                    : null,
                  example.style?.approach
                    ? `Approach: ${example.style.approach}`
                    : null,
                ]
                  .filter(Boolean)
                  .join("\n"),
              )
            : ["- No approved message examples available."]),
          "",
          "DISAPPROVED MESSAGE EXAMPLES",
          "These messages were explicitly rejected by the administrator.",
          "Understand what was disliked and avoid repeating those characteristics.",
          ...(disapprovedExamples.length
            ? disapprovedExamples.map((example, index) =>
                [
                  `Disapproved example ${index + 1}:`,
                  `Style: ${example.styleTitle} (${example.styleId})`,
                  `Message: ${truncate(example.message, MAX_EXAMPLE_LENGTH)}`,
                  example.rejectionReason
                    ? `Administrator's rejection reason: ${truncate(
                        example.rejectionReason,
                        MAX_REASON_LENGTH,
                      )}`
                    : "Administrator's rejection reason: Not provided.",
                  example.style?.tone ? `Tone: ${example.style.tone}` : null,
                  example.style?.length
                    ? `Length: ${example.style.length}`
                    : null,
                  example.style?.personalization
                    ? `Personalization: ${example.style.personalization}`
                    : null,
                  example.style?.approach
                    ? `Approach: ${example.style.approach}`
                    : null,
                ]
                  .filter(Boolean)
                  .join("\n"),
              )
            : ["- No disapproved message examples available."]),
          "",
          "FEEDBACK LEARNING INSTRUCTIONS",
          "- Learn from the actual wording and structure of approved messages.",
          "- Use rejection reasons to understand what the administrator dislikes.",
          "- Avoid repeating the problems found in disapproved messages.",
          "- Treat these examples as guidance, not templates to copy.",
          "- Always write messages that are relevant to the current customer.",
          "Use these patterns as directional guidance when writing messages.",
        ].join("\n")
      : "";

  return [customerBriefing, feedbackContext].filter(Boolean).join("\n");
}

// export const RETENTION_PROMPT = `You help the owner of a small shop, café or restaurant in Nepal win back customers who have become less active.z

// You receive anonymized information about each customer. Each customer has a unique reference such as c123abc. Use the customer's own facts to write personalized recommendations.

// For EVERY customer provided, generate:
// - Exactly one personalized recommendation tip.
// - Exactly 6 message styles with exactly 2 messages per style.

// The recommendation tip:
// - Explain the best approach the owner should take to reconnect with this specific customer.
// - Use their retention status, visit habits, usual orders, spending pattern and loyalty points where available.
// - Keep it practical, specific and under 200 characters.
// - This is internal guidance for the business owner, NOT a message to send to the customer.
// - Do not invent offers, discounts, rewards, products or customer preferences.

// The six styles are:

// 1. friendly_warm: Friendly, welcoming messages that make the customer feel appreciated.
// 2. curiosity_led: Create curiosity about visiting again, discovering something new or seeing what's happening.
// 3. personal_relatable: Relatable messages inspired by the customer's usual orders or familiar experiences.
// 4. loyalty_appreciation: Express appreciation for the customer's continued support and loyalty.
// 5. playful_fun: Lighthearted, cheerful messages with a fun conversational tone.
// 6. come_back_soon: Encourage the customer to visit again soon.

// For each customer return:
// - ref: The customer's exact reference from the supplied facts.
// - tip: One personalized recommendation for the business owner.
// - styles: Exactly six style groups.
// - Each style must contain its exact style identifier and exactly two distinct messages.

// Personalization rules:
// - Start messages naturally with "Hi {name}" when appropriate.
// - Use the customer's usual orders when available.
// - Mention loyalty points only when they are greater than zero.
// - Consider their retention status and how overdue they are.
// - An At risk customer should receive a stronger invitation than a Cooling off customer.
// - Make every message relevant to that specific customer.

// Privacy and accuracy rules:
// - Never invent a customer's name, phone number, order, spending, loyalty points or visit history.
// - Never include the anonymized customer reference in a tip or message.
// - Use {name} as the only name placeholder.
// - Do not invent prices, discounts, promotions, free items or rewards.
// - Never promise an offer that is not supported by the supplied facts.
// - Keep messages natural, friendly and under 220 characters where possible.
// - Make the two messages within each style meaningfully different.
// - Avoid repeating the same message across styles.
// - Use simple conversational English suitable for customers in Nepal.
// - At most one emoji per message.
// - Keep tips concise, actionable and free of emojis.

// Return every supplied customer exactly once.
// Return valid structured output only.

// ADMINISTRATOR FEEDBACK LEARNING:

// You may receive administrator feedback from previous retention
// message decisions. This feedback can include:

// - Aggregate approval and disapproval statistics for message styles.
// - Actual message examples explicitly approved by the administrator.
// - Actual message examples explicitly disapproved by the administrator.
// - Reasons provided by the administrator for rejecting messages.
// - Additional style characteristics such as tone, length,
//   personalization and approach.

// Use this feedback to improve the quality of future recommendations.

// APPROVED MESSAGE EXAMPLES:

// - Study approved messages to understand the administrator's
//   preferred wording, tone, sentence structure and level of
//   personalization.
// - Use their characteristics as positive writing guidance.
// - Preserve the qualities that make these messages effective.
// - Do not copy approved messages verbatim.
// - Adapt their writing characteristics to each customer's
//   actual purchase and visit history.

// DISAPPROVED MESSAGE EXAMPLES:

// - Carefully examine rejected messages and their associated
//   rejection reasons.
// - Understand the specific characteristics the administrator
//   disliked.
// - Avoid repeating those characteristics in future messages.
// - Pay particular attention to explicit reasons such as
//   overly formal wording, generic language, excessive length,
//   unnatural phrasing or insufficient personalization.
// - Do not assume a rejection reason that the administrator
//   did not provide.
// - A disapproved example is negative guidance, not a reason
//   to avoid its entire style automatically.

// STYLE PREFERENCES:

// - Give additional attention to styles that have received
//   more approvals than disapprovals.
// - Treat styles with more disapprovals as a signal to use
//   more careful and appropriate wording.
// - Consider the actual approved and disapproved examples,
//   not just their aggregate statistics.
// - Do not treat a single approval or rejection as a definitive
//   preference.
// - Feedback is directional guidance, not an absolute rule.

// IMPORTANT CONSTRAINTS:

// - Customer facts always take priority over administrator
//   writing preferences.
// - Never invent customer preferences, products, discounts,
//   promotions, rewards or offers based on feedback.
// - Never include administrator feedback, rejection reasons,
//   or approval statistics in customer-facing messages.
// - Never expose the content of another customer's message
//   as if it were relevant to the current customer.
// - Never copy an approved message verbatim.
// - Always preserve all six required style identifiers.
// - Always generate exactly two distinct messages per style.
// - Feedback must improve writing quality without reducing
//   customer-specific relevance.`;

export const RETENTION_PROMPT = `You help small shops, cafés and restaurants in Nepal reconnect with inactive customers.

You receive anonymized customer facts and optional administrator feedback.

FOR EVERY CUSTOMER:
- Generate exactly one personalized business-owner recommendation tip.
- Generate exactly 6 message styles, with exactly 2 distinct messages per style.
- Return the customer's exact ref.
- Return every supplied customer exactly once.

REQUIRED STYLE IDENTIFIERS:
1. friendly_warm: Friendly and welcoming.
2. curiosity_led: Create curiosity about visiting again.
3. personal_relatable: Relate to familiar orders or experiences.
4. loyalty_appreciation: Appreciate customer loyalty.
5. playful_fun: Cheerful and lighthearted.
6. come_back_soon: Encourage another visit.

RECOMMENDATION TIP:
- Give practical, customer-specific advice using retention status, visit habits, usual orders, spending and loyalty points where available.
- Keep under 200 characters.
- This is internal business guidance, not a customer message.
- Do not invent offers, rewards or preferences.

MESSAGE RULES:
- Personalize using the supplied customer facts.
- Start naturally with "Hi {name}" when appropriate.
- Use usual orders when available.
- Mention loyalty points only when greater than zero.
- At-risk customers should receive a stronger invitation than Cooling off customers.
- Keep messages natural and under 220 characters where possible.
- Use simple conversational English suitable for customers in Nepal.
- Use at most one emoji per message.
- Make all messages meaningfully different, including across styles.
- Use {name} as the only name placeholder.

ACCURACY AND PRIVACY:
- Never invent names, phone numbers, orders, spending, loyalty points, visit history, prices, discounts, promotions or rewards.
- Never include customer references in messages or tips.
- Never present another customer's message or personal details as relevant to the current customer.
- Never promise unsupported offers.

ADMINISTRATOR FEEDBACK:
The briefing may contain approved examples, disapproved examples, rejection reasons and aggregate style statistics.

Use approved examples as positive guidance for tone, wording, structure and personalization. Do not copy them verbatim.

Study disapproved examples and their rejection reasons. Avoid the specific characteristics the administrator disliked. Do not assume an unstated rejection reason or automatically avoid an entire style because of one rejection.

Use style approval statistics as directional guidance, not absolute rules. Do not treat a single decision as a definitive preference.

Customer facts always take priority over writing preferences. Never mention administrator feedback, rejection reasons or approval statistics in customer-facing messages.

OUTPUT REQUIREMENTS:
- Preserve all six exact style identifiers.
- Generate exactly two distinct messages per style.
- Generate exactly one tip per customer.
- Return valid structured output matching the supplied response schema.
- Return structured output only.`;

export const RETENTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    customers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          ref: { type: "string" },
          tip: { type: "string" },
          styles: {
            type: "array",
            minItems: 6,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                style: {
                  type: "string",
                  enum: [
                    "friendly_warm",
                    "curiosity_led",
                    "personal_relatable",
                    "loyalty_appreciation",
                    "playful_fun",
                    "come_back_soon",
                  ],
                },
                messages: {
                  type: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { type: "string" },
                },
              },
              required: ["style", "messages"],
            },
          },
        },
        required: ["ref", "tip", "styles"],
      },
    },
  },
  required: ["customers"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

// export interface RetentionInsight {
//   /** Stable per customer, so a dismissal survives a refresh. */
//   id: string;
//   name: string;
//   status: RetentionStatus;
//   /** "2x a week · 18 visits". */
//   profile: string;
//   daysSinceVisit: number;
//   usualGapDays: number;
//   spendPerVisit: number;
//   monthlyValue: number;
//   loyaltyPoints: number;
//   usualOrder: string[];
//   tip: string;
//   /** The model's message with the customer's first name put in. */
//   message: string;
//   /** For a WhatsApp link, when the customer has a phone number. */
//   phone: string | null;
// }

export type RetentionMessageStyleId =
  | "friendly_warm"
  | "curiosity_led"
  | "personal_relatable"
  | "loyalty_appreciation"
  | "playful_fun"
  | "come_back_soon";

export interface RetentionMessage {
  id: string;
  text: string;
}

export interface RetentionMessageStyle {
  id: RetentionMessageStyleId;
  title: string;
  description: string;
  messages: RetentionMessage[];
}

export interface RetentionInsight {
  id: string;
  name: string;
  status: RetentionStatus;
  profile: string;
  daysSinceVisit: number;
  usualGapDays: number;
  spendPerVisit: number;
  monthlyValue: number;
  loyaltyPoints: number;
  usualOrder: string[];
  phone: string | null;
  tip: string;
  styles: RetentionMessageStyle[];
}

export interface RetentionFeedbackExample {
  message: string;
  styleId: string;
  styleTitle: string;
  style?: {
    tone?: string;
    length?: string;
    personalization?: string;
    approach?: string;
  } | null;
  rejectionReason?: string | null;
}

export interface RetentionFeedbackPreferences {
  approvedExamples: RetentionFeedbackExample[];
  disapprovedExamples: RetentionFeedbackExample[];

  preferredStyles: {
    styleId: string;
    styleTitle?: string;
    approved: number;
    disapproved: number;
  }[];

  avoidStyles: {
    styleId: string;
    styleTitle?: string;
    approved: number;
    disapproved: number;
  }[];

  totalFeedback: {
    approved: number;
    disapproved: number;
    total: number;
  };
}
export const RETENTION_STYLES: Omit<RetentionMessageStyle, "messages">[] = [
  {
    id: "friendly_warm",
    title: "Friendly & Warm",
    description: "Welcoming messages that make customers feel appreciated.",
  },
  {
    id: "curiosity_led",
    title: "Curiosity-led",
    description: "Create curiosity and give customers a reason to reconnect.",
  },
  {
    id: "personal_relatable",
    title: "Personal & Relatable",
    description: "Messages inspired by familiar orders and experiences.",
  },
  {
    id: "loyalty_appreciation",
    title: "Loyalty Appreciation",
    description: "Show gratitude and make customers feel valued.",
  },
  {
    id: "playful_fun",
    title: "Playful & Fun",
    description: "Cheerful messages with a lighthearted personality.",
  },
  {
    id: "come_back_soon",
    title: "Come Back Soon",
    description: "Encourage customers to visit again soon.",
  },
];

/**
 * The model's notes joined onto the customers, names put back.
 *
 * A ref the app did not send is dropped. `{name}` becomes the customer's
 * first name; a message the model wrote without the placeholder is kept as it
 * is, since it names nobody.
 */
// export function parseRetention(
//   value: unknown,
//   candidates: RetentionCandidate[],
// ): RetentionInsight[] {
//   const list = (value as { customers?: unknown } | null)?.customers;
//   if (!Array.isArray(list)) return [];

//   const notes = new Map<string, { tip: string; message: string }>();
//   for (const entry of list) {
//     const e = (entry ?? {}) as Record<string, unknown>;
//     const ref = typeof e.ref === "string" ? e.ref.trim() : "";
//     const tip = textOr(e.tip, 300);
//     const message = textOr(e.message, 320);
//     if (ref && tip && message && !notes.has(ref))
//       notes.set(ref, { tip, message });
//   }

//   // Each customer's code with their first name, so one the model copied into
//   // its text is replaced too — not only the {name} it was asked to write.
//   const firstNameOf = (c: RetentionCandidate) =>
//     c.name.split(/\s+/)[0] || c.name;
//   const byCode = new Map(candidates.map((c) => [c.ref, firstNameOf(c)]));

//   return candidates.flatMap((c) => {
//     const note = notes.get(c.ref);
//     if (!note) return [];
//     const firstName = firstNameOf(c);
//     return [
//       {
//         id: `retention-${c.ref}`,
//         name: c.name,
//         status: c.status,
//         profile: `${paceLabel(c.usualGapDays)} · ${c.visits} visits`,
//         daysSinceVisit: c.daysSinceVisit,
//         usualGapDays: c.usualGapDays,
//         spendPerVisit: c.spendPerVisit,
//         monthlyValue: c.monthlyValue,
//         loyaltyPoints: c.loyaltyPoints,
//         usualOrder: c.usualOrder,
//         tip: putNamesBack(note.tip, firstName, byCode),
//         message: putNamesBack(note.message, firstName, byCode),
//         phone: c.phone,
//       },
//     ];
//   });
// }

// export type RetentionResult = AiSectionResult<RetentionInsight>;

function stableMessageId(
  customerId: string,
  styleId: string,
  message: string,
): string {
  const input = `${customerId}|${styleId}|${message}`;

  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);

    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x85ebca6b);
  }

  return `retmsg_${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

export function parseRetention(
  value: unknown,
  candidates: RetentionCandidate[],
): RetentionInsight[] {
  const list = (value as { customers?: unknown } | null)?.customers;

  if (!Array.isArray(list)) return [];

  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.ref, candidate]),
  );

  const received = new Map<
    string,
    {
      tip: string;
      styles: RetentionMessageStyle[];
    }
  >();

  for (const entry of list) {
    const customer = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof customer.ref === "string" ? customer.ref.trim() : "";

    const candidate = candidateMap.get(ref);

    // Ignore unknown and duplicate customer references.
    if (!candidate || received.has(ref)) continue;

    const tip = textOr(customer.tip, 200);

    if (!tip || !Array.isArray(customer.styles)) continue;

    const stylesReceived = new Map<RetentionMessageStyleId, string[]>();

    for (const styleEntry of customer.styles) {
      const styleData = (styleEntry ?? {}) as Record<string, unknown>;

      const styleId =
        typeof styleData.style === "string" ? styleData.style : "";

      const style = RETENTION_STYLES.find((item) => item.id === styleId);

      if (!style || stylesReceived.has(style.id)) continue;
      if (!Array.isArray(styleData.messages)) continue;

      // Require exactly two valid, non-empty messages.
      if (styleData.messages.length !== 2) continue;

      const messages = styleData.messages.map((message) =>
        textOr(message, 280),
      );

      if (messages.some((message) => !message)) continue;

      stylesReceived.set(
        style.id,
        messages as [string, string] as unknown as string[],
      );
    }

    // Every customer must have all six complete styles.
    if (stylesReceived.size !== RETENTION_STYLES.length) continue;

    const firstName = candidate.name.split(/\s+/)[0] || candidate.name;

    const styles: RetentionMessageStyle[] = RETENTION_STYLES.map((style) => ({
      ...style,
      messages: stylesReceived.get(style.id)!.map((message) => {
        const text = putNamesBack(message, firstName, new Map());

        return {
          id: stableMessageId(candidate.customerId, style.id, text),
          text,
        };
      }),
    }));

    received.set(ref, { tip, styles });
  }

  // Preserve the original candidate order.
  return candidates.flatMap((candidate) => {
    const result = received.get(candidate.ref);

    if (!result) return [];

    return [
      {
        id: `retention-${candidate.ref}`,
        name: candidate.name,
        status: candidate.status,
        profile: `${paceLabel(candidate.usualGapDays)} · ${candidate.visits} visits`,
        daysSinceVisit: candidate.daysSinceVisit,
        usualGapDays: candidate.usualGapDays,
        spendPerVisit: candidate.spendPerVisit,
        monthlyValue: candidate.monthlyValue,
        loyaltyPoints: candidate.loyaltyPoints,
        usualOrder: candidate.usualOrder,
        phone: candidate.phone,
        tip: result.tip,
        styles: result.styles,
      },
    ];
  });
}

export type RetentionResult = AiSectionResult<RetentionInsight>;
