/**
 * Sales Recommendations on the AI Insights page.
 *
 * The work is split on purpose. This file does the arithmetic — sales, profit,
 * margins, discounts, and what changed against the month before — so every
 * number the merchant reads was calculated here, from their own report. The
 * model is only asked to turn those facts into advice. It is never asked to
 * add up, and it is told not to invent figures, so a recommendation cannot
 * quote a margin that does not exist.
 *
 * Doing the maths first also keeps each call small: the model reads a short
 * list of lines instead of the raw report.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import {
  SECTION_WINDOW_DAYS,
  changePct,
  num,
  round1,
  signed,
  whole,
  type AiSectionResult,
  type SalesByItemRow,
  type SalesWindows,
} from "./shared";

/** Days in the window, and in the window it is compared with. */
export const SALES_WINDOW_DAYS = SECTION_WINDOW_DAYS;

/**
 * Bump when the prompt, the schema or the facts change meaningfully.
 *
 * It is part of the cache key, so answers written under the old instructions
 * stop being served the moment the new ones ship.
 */
export const SALES_RECOMMENDATIONS_VERSION = "v1";

// ── Facts ─────────────────────────────────────────────────────────────────

export interface ItemFacts {
  name: string;
  category: string | null;
  units: number;
  /** Before tax. Tax is collected for the government, not earned. */
  sales: number;
  /** Null when any of the item's sales had no cost price to judge against. */
  profit: number | null;
  marginPct: number | null;
  discount: number;
  /** Discount as a share of what the item would have sold for without it. */
  discountPct: number;
  /** Units sold for less than their cost price. */
  unitsBelowCost: number;
  /** This item's share of all sales in the window. */
  sharePct: number;
  previousUnits: number;
  previousSales: number;
  /** Null when it did not sell at all in the previous window. */
  salesChangePct: number | null;
}

export interface CategoryFacts {
  name: string;
  sales: number;
  sharePct: number;
  previousSales: number;
  salesChangePct: number | null;
}

export interface SalesFacts {
  windows: SalesWindows;
  totals: {
    sales: number;
    previousSales: number;
    salesChangePct: number | null;
    units: number;
    /** Profit over the items whose cost is known. */
    profit: number;
    discount: number;
    itemsSold: number;
    itemsWithoutCost: number;
  };
  categories: CategoryFacts[];
  /** The lines worth the model's attention, most sales first. */
  items: ItemFacts[];
  /** Sold in the previous window, not at all in this one. */
  stoppedSelling: {
    name: string;
    previousSales: number;
    previousUnits: number;
  }[];
  /** Items sold this window that are not in `items`. */
  otherItems: number;
}

interface Merged {
  name: string;
  category: string | null;
  units: number;
  sales: number;
  profit: number;
  costMissing: boolean;
  discount: number;
  unitsBelowCost: number;
}

/**
 * Rows collapsed into one entry per product.
 *
 * Matched without regard to case or spacing: the report spells the same
 * variant "Jelly [red, blue ,pink]" and "Jelly [Red, blue ,pink]", and
 * counting those as two products would halve each one's figures. The first
 * spelling seen is the one shown.
 */
function mergeRows(rows: SalesByItemRow[]): Map<string, Merged> {
  const merged = new Map<string, Merged>();

  for (const row of rows) {
    const name = (row.itemName ?? "").trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase();

    const units = num(row.count);
    const price = num(row.price);
    const cost = num(row.costPrice);
    const sales = num(row.totalRevenue) - num(row.totalTax);

    // A cost price of zero means nobody entered one, not that the item is
    // free to make. Its "profit" would be the whole sale, so it is left out
    // rather than reported as a 100% margin.
    const costMissing = cost <= 0 && units > 0;

    const entry = merged.get(key) ?? {
      name,
      category: row.category?.trim() || null,
      units: 0,
      sales: 0,
      profit: 0,
      costMissing: false,
      discount: 0,
      unitsBelowCost: 0,
    };

    entry.units += units;
    entry.sales += sales;
    entry.profit += num(row.netProfit);
    entry.costMissing ||= costMissing;
    entry.discount += num(row.itemDiscount);
    if (!costMissing && price < cost) entry.unitsBelowCost += units;
    entry.category ??= row.category?.trim() || null;

    merged.set(key, entry);
  }

  return merged;
}

/** Most item lines the model is shown. Beyond this the briefing only grows. */
const MAX_ITEM_LINES = 20;
/** The best sellers are always listed, up to this many. */
const TOP_SELLERS = 10;
const MAX_STOPPED_LINES = 5;

/** A discount this large is worth a second look. */
const HEAVY_DISCOUNT_PCT = 20;
/** A fall this steep is worth a second look. */
const SHARP_DROP_PCT = -40;

export function buildSalesFacts(
  current: SalesByItemRow[],
  previous: SalesByItemRow[],
  windows: SalesWindows,
): SalesFacts {
  const now = mergeRows(current);
  const before = mergeRows(previous);

  const totalSales = [...now.values()].reduce((sum, i) => sum + i.sales, 0);
  const totalPrevious = [...before.values()].reduce(
    (sum, i) => sum + i.sales,
    0,
  );

  const all: ItemFacts[] = [...now.entries()]
    .filter(([, i]) => i.units > 0)
    .map(([key, i]) => {
      const prev = before.get(key);
      const listValue = i.sales + i.discount;
      return {
        name: i.name,
        category: i.category,
        units: i.units,
        sales: i.sales,
        profit: i.costMissing ? null : i.profit,
        marginPct:
          i.costMissing || i.sales <= 0
            ? null
            : round1((i.profit / i.sales) * 100),
        discount: i.discount,
        discountPct: listValue > 0 ? round1((i.discount / listValue) * 100) : 0,
        unitsBelowCost: i.unitsBelowCost,
        sharePct: totalSales > 0 ? round1((i.sales / totalSales) * 100) : 0,
        previousUnits: prev?.units ?? 0,
        previousSales: prev?.sales ?? 0,
        salesChangePct: changePct(i.sales, prev?.sales ?? 0),
      };
    })
    .sort((a, b) => b.sales - a.sales);

  // The best sellers, plus anything with a problem the model should see even
  // if it sells little: a loss, a heavy discount, a sharp fall.
  const flagged = (i: ItemFacts) =>
    (i.profit !== null && i.profit < 0) ||
    i.unitsBelowCost > 0 ||
    i.discountPct >= HEAVY_DISCOUNT_PCT ||
    (i.salesChangePct !== null && i.salesChangePct <= SHARP_DROP_PCT);

  const chosen = new Set(all.slice(0, TOP_SELLERS));
  for (const item of all) {
    if (chosen.size >= MAX_ITEM_LINES) break;
    if (flagged(item)) chosen.add(item);
  }
  const items = all.filter((i) => chosen.has(i));

  const stoppedSelling = [...before.entries()]
    .filter(([key, i]) => i.units > 0 && !now.has(key))
    .map(([, i]) => ({
      name: i.name,
      previousSales: i.sales,
      previousUnits: i.units,
    }))
    .sort((a, b) => b.previousSales - a.previousSales)
    .slice(0, MAX_STOPPED_LINES);

  const categoryTotals = (merged: Map<string, Merged>) => {
    const totals = new Map<string, number>();
    for (const i of merged.values()) {
      const name = i.category ?? "Uncategorised";
      totals.set(name, (totals.get(name) ?? 0) + i.sales);
    }
    return totals;
  };
  const catNow = categoryTotals(now);
  const catBefore = categoryTotals(before);
  const categories: CategoryFacts[] = [...catNow.entries()]
    .map(([name, sales]) => ({
      name,
      sales,
      sharePct: totalSales > 0 ? round1((sales / totalSales) * 100) : 0,
      previousSales: catBefore.get(name) ?? 0,
      salesChangePct: changePct(sales, catBefore.get(name) ?? 0),
    }))
    .sort((a, b) => b.sales - a.sales);

  return {
    windows,
    totals: {
      sales: totalSales,
      previousSales: totalPrevious,
      salesChangePct: changePct(totalSales, totalPrevious),
      units: all.reduce((sum, i) => sum + i.units, 0),
      profit: all.reduce((sum, i) => sum + (i.profit ?? 0), 0),
      discount: all.reduce((sum, i) => sum + i.discount, 0),
      itemsSold: all.length,
      itemsWithoutCost: all.filter((i) => i.profit === null).length,
    },
    categories,
    items,
    stoppedSelling,
    otherItems: all.length - items.length,
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

/**
 * The facts as the short text the model reads.
 *
 * One line per item, in words and plain numbers. Every figure the model could
 * quote is already worked out here, so it has nothing to calculate.
 */
export function salesBriefing(
  facts: SalesFacts,
  currencySymbol: string,
): string {
  const money = (value: number) => `${currencySymbol} ${whole(value)}`;
  const { current, previous } = facts.windows;
  const t = facts.totals;

  const change = (pct: number | null, before: number) =>
    pct === null
      ? "new, no sales before"
      : `${signed(pct)} vs ${money(before)}`;

  const lines: string[] = [
    `Window: last ${SALES_WINDOW_DAYS} days, ${current.startDate} to ${current.endDate}. Compared with ${previous.startDate} to ${previous.endDate}.`,
    `Money is before tax, in ${currencySymbol}.`,
    "",
    `Totals: sales ${money(t.sales)} (${change(t.salesChangePct, t.previousSales)}) · ${whole(t.units)} units · ${t.itemsSold} different items · discounts given ${money(t.discount)}.`,
    t.itemsWithoutCost > 0
      ? `Profit ${money(t.profit)} on the items with a cost price. ${t.itemsWithoutCost} item(s) have no cost price set, so their profit is unknown.`
      : `Profit ${money(t.profit)}.`,
    "",
    "Categories (sales · share · change):",
    ...facts.categories.map(
      (c) =>
        `- ${c.name}: ${money(c.sales)} · ${c.sharePct}% · ${change(c.salesChangePct, c.previousSales)}`,
    ),
    "",
    "Items (sales · units · margin · discount · change):",
    ...facts.items.map((i) => {
      const parts = [
        money(i.sales),
        `${whole(i.units)} units`,
        i.marginPct === null
          ? "margin unknown (no cost price)"
          : `margin ${i.marginPct}% (profit ${money(i.profit ?? 0)})`,
        i.discount > 0
          ? `discount ${money(i.discount)} (${i.discountPct}% off)`
          : "no discount",
        change(i.salesChangePct, i.previousSales),
      ];
      if (i.unitsBelowCost > 0) {
        parts.push(`${whole(i.unitsBelowCost)} units sold below cost price`);
      }
      return `- ${i.name}${i.category ? ` [${i.category}]` : ""}: ${parts.join(" · ")}`;
    }),
  ];

  if (facts.otherItems > 0) {
    lines.push(`(${facts.otherItems} smaller items not listed.)`);
  }

  if (facts.stoppedSelling.length > 0) {
    lines.push(
      "",
      "Sold in the previous window, none in this one:",
      ...facts.stoppedSelling.map(
        (i) =>
          `- ${i.name}: ${money(i.previousSales)} from ${whole(i.previousUnits)} units before`,
      ),
    );
  }

  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const SALES_RECOMMENDATIONS_PROMPT = `You advise the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS. You receive sales facts the app has already calculated for the last 30 days, compared with the 30 days before.

Write 3 to 5 recommendations the owner can act on this week.

Rules:
- Use only the facts given. Never invent items, numbers, percentages or forecasts. Only quote a figure that appears in the facts.
- Name the item or category exactly as written in the facts, in double quotes.
- Say what is happening and what to do about it, in one or two short sentences, under 200 characters.
- kind "warning": money being lost or sales slipping — sold below cost, a negative margin, heavy discounting, a sharp drop, an item that stopped selling.
- kind "info": an opportunity — something to feature, pair, reprice or stock up on.
- kind "success": something working well that is worth keeping. At most one.
- Put the most costly problem first.
- When margin is unknown because no cost price is set, do not judge the margin; suggest adding the cost price if the item matters.
- Plain words for a busy owner. No markdown, no emojis, no jargon.
- If the facts are too thin for a useful point, return fewer recommendations rather than padding.`;

export const SALES_RECOMMENDATIONS_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["warning", "info", "success"] },
          text: { type: "string" },
        },
        required: ["kind", "text"],
      },
    },
  },
  required: ["recommendations"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export type RecommendationKind = "warning" | "info" | "success";

export interface SalesRecommendation {
  id: string;
  kind: RecommendationKind;
  text: string;
}

const KINDS: readonly RecommendationKind[] = ["warning", "info", "success"];

/** More than this is a list nobody reads to the end. */
const MAX_RECOMMENDATIONS = 6;
const MAX_TEXT_CHARS = 300;

/**
 * The model's answer, reduced to what can be shown.
 *
 * The schema asks for this shape; it does not guarantee it. Anything that does
 * not fit is dropped item by item rather than failing the whole section, so
 * one odd entry costs one line, not the card.
 *
 * `idPrefix` should differ per generation: a dismissal is remembered by id,
 * and a fresh answer must not inherit the previous one's dismissals.
 */
export function parseSalesRecommendations(
  value: unknown,
  idPrefix: string,
): SalesRecommendation[] {
  const list = (value as { recommendations?: unknown } | null)?.recommendations;
  if (!Array.isArray(list)) return [];

  const out: SalesRecommendation[] = [];
  for (const entry of list) {
    const kind = (entry as { kind?: unknown })?.kind;
    const text = (entry as { text?: unknown })?.text;
    if (!KINDS.includes(kind as RecommendationKind)) continue;
    if (typeof text !== "string" || !text.trim()) continue;

    out.push({
      id: `${idPrefix}-${out.length}`,
      kind: kind as RecommendationKind,
      text: text.trim().slice(0, MAX_TEXT_CHARS),
    });
    if (out.length >= MAX_RECOMMENDATIONS) break;
  }
  return out;
}

// ── What the page receives ────────────────────────────────────────────────

export type SalesRecommendationsResult = AiSectionResult<SalesRecommendation>;
