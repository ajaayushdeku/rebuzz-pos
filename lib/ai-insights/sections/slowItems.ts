/**
 * Slow Item Insights on the AI Insights page.
 *
 * The app decides which items are slow and why, from the sales report and the
 * menu; the model only writes what to do about them. Every figure on a card —
 * the "-27%", the "8/week", the stock tied up — is worked out here, and the
 * model's answer is joined back onto these facts by reference, so it cannot
 * rename an item or quote a number that was not given.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import {
  formatMoney,
  SECTION_WINDOW_DAYS,
  changePct,
  emojiOr,
  menuMarginPct,
  perWeek,
  productMatcher,
  salesByProduct,
  textOr,
  whole,
  type AiSectionResult,
  type MenuProduct,
  type SalesByItemRow,
  type SalesWindows,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const SLOW_ITEMS_VERSION = "v2";

// ── Facts ─────────────────────────────────────────────────────────────────

/** Why the app flagged an item. */
export type SlowKind = "drop" | "no-sales" | "low";

export interface SlowCandidate {
  /** Short id the model answers with, taken from the product id. */
  ref: string;
  productId: string;
  name: string;
  category: string | null;
  kind: SlowKind;
  price: number;
  costPrice: number;
  marginPct: number | null;
  units: number;
  previousUnits: number;
  sales: number;
  previousSales: number;
  /** Change in units sold. Null when nothing sold in the previous window. */
  unitsChangePct: number | null;
  perWeek: number;
  stock: number | null;
  /** Stock on hand at cost price, when both are known. */
  stockValue: number | null;
  description: string;
}

export interface SlowItemsFacts {
  windows: SalesWindows;
  menuSize: number;
  totalUnits: number;
  /** Items the slow ones could be paired with. */
  bestSellers: {
    name: string;
    units: number;
    perWeek: number;
    price: number;
  }[];
  candidates: SlowCandidate[];
}

/** An item needs this many sales before, for a fall to mean anything. */
const MIN_PREVIOUS_UNITS = 5;
/** A fall in units at least this steep. */
const DROP_PCT = -30;
/** A low seller: under this share of all units sold… */
const LOW_SHARE_PCT = 3;
/** …and under this many a week. */
const LOW_PER_WEEK = 3;

const MAX_CANDIDATES = 6;
const MAX_PER_KIND = 3;
const BEST_SELLERS = 5;

/**
 * Refs the model answers with, taken from the product ids.
 *
 * Not "s1, s2…" by position. The answer is cached for the day while sales keep
 * coming in, and positions shift as they do: the cached answer for "s1" would
 * then be joined onto whichever item was first by the evening — advice about
 * one item printed under another's name. A ref from the id always means the
 * same product. The last six characters are enough to tell a menu apart, and
 * the full id is used for any that collide.
 */
function stableRefs(productIds: string[]): string[] {
  const short = productIds.map((id) => `p${id.slice(-6)}`);
  return short.map((ref, i) =>
    short.indexOf(ref) === short.lastIndexOf(ref) ? ref : `p${productIds[i]}`,
  );
}

export function buildSlowItemsFacts(
  menu: MenuProduct[],
  current: SalesByItemRow[],
  previous: SalesByItemRow[],
  windows: SalesWindows,
): SlowItemsFacts {
  const match = productMatcher(menu);
  const now = salesByProduct(current, match);
  const before = salesByProduct(previous, match);

  const totalUnits = [...now.values()].reduce((sum, s) => sum + s.units, 0);
  // Only what a customer can order today. An item switched off, or with no
  // price, is not a slow seller — it is not for sale.
  const onMenu = menu.filter((p) => p.isAvailable && p.price > 0);

  const drops: SlowCandidate[] = [];
  const noSales: SlowCandidate[] = [];
  const lows: SlowCandidate[] = [];

  for (const product of onMenu) {
    const cur = now.get(product.id) ?? { units: 0, sales: 0 };
    const prev = before.get(product.id) ?? { units: 0, sales: 0 };
    const unitsChange = changePct(cur.units, prev.units);
    const sharePct = totalUnits > 0 ? (cur.units / totalUnits) * 100 : 0;

    const kind: SlowKind | null =
      cur.units === 0
        ? "no-sales"
        : prev.units >= MIN_PREVIOUS_UNITS &&
            unitsChange !== null &&
            unitsChange <= DROP_PCT
          ? "drop"
          : sharePct < LOW_SHARE_PCT && perWeek(cur.units) < LOW_PER_WEEK
            ? "low"
            : null;
    if (!kind) continue;

    const candidate: SlowCandidate = {
      ref: "",
      productId: product.id,
      name: product.name,
      category: product.categoryName,
      kind,
      price: product.price,
      costPrice: product.costPrice,
      marginPct: menuMarginPct(product),
      units: cur.units,
      previousUnits: prev.units,
      sales: cur.sales,
      previousSales: prev.sales,
      unitsChangePct: unitsChange,
      perWeek: perWeek(cur.units),
      stock: product.stock,
      stockValue:
        product.stock !== null && product.stock > 0 && product.costPrice > 0
          ? product.stock * product.costPrice
          : null,
      description: product.description,
    };

    if (kind === "drop") drops.push(candidate);
    else if (kind === "no-sales") noSales.push(candidate);
    else lows.push(candidate);
  }

  // Worst first within each kind: the most sales lost, the most that used to
  // sell or the most money sitting on the shelf, the fewest sold.
  drops.sort((a, b) => b.previousSales - b.sales - (a.previousSales - a.sales));
  noSales.sort(
    (a, b) =>
      b.previousSales - a.previousSales ||
      (b.stockValue ?? 0) - (a.stockValue ?? 0),
  );
  lows.sort((a, b) => a.units - b.units);

  // A mix rather than one kind filling the list: three falls, three items
  // nobody ordered, then the quietest sellers, topped up from what is left.
  const picked = [
    ...drops.slice(0, MAX_PER_KIND),
    ...noSales.slice(0, MAX_PER_KIND),
  ];
  for (const rest of [
    lows,
    drops.slice(MAX_PER_KIND),
    noSales.slice(MAX_PER_KIND),
  ]) {
    for (const c of rest) {
      if (picked.length >= MAX_CANDIDATES) break;
      picked.push(c);
    }
  }
  const chosen = picked.slice(0, MAX_CANDIDATES);
  const refs = stableRefs(chosen.map((c) => c.productId));
  const candidates = chosen.map((c, i) => ({ ...c, ref: refs[i] }));

  const bestSellers = onMenu
    .map((p) => ({ p, units: now.get(p.id)?.units ?? 0 }))
    .filter(({ units }) => units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, BEST_SELLERS)
    .map(({ p, units }) => ({
      name: p.name,
      units,
      perWeek: perWeek(units),
      price: p.price,
    }));

  return {
    windows,
    menuSize: onMenu.length,
    totalUnits,
    bestSellers,
    candidates,
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function slowItemsBriefing(
  facts: SlowItemsFacts,
  currencySymbol: string,
): string {
  const money = (value: number) => formatMoney(currencySymbol, value);
  const { current, previous } = facts.windows;

  const finding = (c: SlowCandidate) => {
    if (c.kind === "no-sales") {
      return c.previousUnits > 0
        ? `no sales in the last ${SECTION_WINDOW_DAYS} days (${whole(c.previousUnits)} sold in the ${SECTION_WINDOW_DAYS} before)`
        : `no sales in the last ${SECTION_WINDOW_DAYS * 2} days`;
    }
    if (c.kind === "drop") {
      // Both sides as a weekly pace, the same unit the percent compares. With
      // only "now N a week" beside it, the model wrote "fell 93.5% to 6.1
      // weekly" — a percent with nothing to be a percent of.
      return `sales fell from ${perWeek(c.previousUnits)} a week to ${c.perWeek} a week (${whole(c.previousUnits)} sold in the ${SECTION_WINDOW_DAYS} days before, ${whole(c.units)} in the last ${SECTION_WINDOW_DAYS}), down ${dropPct(c)}%`;
    }
    return `low seller: ${whole(c.units)} sold, ${c.perWeek} a week`;
  };

  const lines = [
    `Window: last ${SECTION_WINDOW_DAYS} days, ${current.startDate} to ${current.endDate}. Compared with ${previous.startDate} to ${previous.endDate}.`,
    `Prices are menu prices before tax, in ${currencySymbol}.`,
    `Menu: ${facts.menuSize} items for sale. ${whole(facts.totalUnits)} units sold in the window.`,
    "",
    "Best sellers (possible pairings):",
    ...(facts.bestSellers.length > 0
      ? facts.bestSellers.map(
          (b) =>
            `- ${b.name}: ${whole(b.units)} sold, ${b.perWeek} a week, price ${money(b.price)}`,
        )
      : ["- none"]),
    "",
    "Slow items (ref · item · what the app found · price and margin · stock · menu description):",
    ...facts.candidates.map((c) => {
      const parts = [
        `${c.ref} · ${c.name}${c.category ? ` [${c.category}]` : ""}`,
        finding(c),
        c.marginPct === null
          ? `price ${money(c.price)}, margin unknown (no cost price)`
          : `price ${money(c.price)}, cost ${money(c.costPrice)}, margin ${c.marginPct}%`,
      ];
      if (c.stock !== null) {
        parts.push(
          c.stockValue !== null
            ? `${whole(c.stock)} in stock (${money(c.stockValue)} at cost)`
            : `${whole(c.stock)} in stock`,
        );
      }
      if (c.description) parts.push(`"${c.description.slice(0, 80)}"`);
      return `- ${parts.join(" · ")}`;
    }),
  ];

  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const SLOW_ITEMS_PROMPT = `You advise the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS. The app has already found the menu items that are selling slowly, with the facts for each. Write a practical fix for the ones worth acting on.

Return at most 4 items, the one where acting matters most first. Leave out an item when you have nothing useful to say about it.

For each item:
- ref: the item's ref exactly as given, e.g. p3caea5. Only refs from the list.
- icon: one emoji that fits the item.
- description: one sentence on what is going wrong, under 140 characters.
- tip: one or two sentences on what to do, under 200 characters.
- move: "rework" (change the recipe or format), "bundle" (pair it with a best seller), "reprice", "promote" (show it more, or offer it at a better time), or "remove" (take it off the menu).
- action: a short button label for the move, under 30 characters, e.g. "Bundle with Tea" or "Take off the menu".

Rules:
- Use only the facts given. Never invent numbers, items, sales forecasts or ingredients the facts do not mention.
- Only pair an item with a best seller listed in the facts, named exactly as written.
- When you say sales fell, give both sides in the same unit, then the percent: "fell from 94 a week to 6 a week (down 94%)", using the figures given. Never a percent with only one side, as in "fell 94% to 6 a week".
- When a lot of stock is sitting unsold, say how much money is tied up.
- When the margin is unknown, do not judge the margin.
- Plain words for a busy owner. No markdown. The only emoji goes in icon.`;

export const SLOW_ITEMS_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          icon: { type: "string" },
          description: { type: "string" },
          tip: { type: "string" },
          move: {
            type: "string",
            enum: ["rework", "bundle", "reprice", "promote", "remove"],
          },
          action: { type: "string" },
        },
        required: ["ref", "icon", "description", "tip", "move", "action"],
      },
    },
  },
  required: ["items"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export type SlowItemMove =
  "rework" | "bundle" | "reprice" | "promote" | "remove";

const MOVES: readonly SlowItemMove[] = [
  "rework",
  "bundle",
  "reprice",
  "promote",
  "remove",
];

export interface SlowItemInsight {
  id: string;
  productId: string;
  icon: string;
  name: string;
  kind: SlowKind;
  /** "-27%", "No sales" or "Low seller" — from the app, never the model. */
  signal: string;
  /** "94 → 6.1/week", "8/week", "12 sold the month before" — from the app. */
  context: string;
  description: string;
  tip: string;
  action: string;
  move: SlowItemMove;
}

const MAX_ITEMS = 4;

function weekly(value: number): string {
  return value < 1 ? "under 1/week" : `${value}/week`;
}

/**
 * How far a falling item's sales fell, as a whole percent. One figure for the
 * model and the card alike: `Math.round(-93.5)` is -93, and a card saying 93%
 * under a sentence saying 93.5% looks like two different answers.
 */
function dropPct(c: SlowCandidate): number {
  return Math.round(Math.abs(c.unitsChangePct ?? 0));
}

/** "94 → 6.1/week": the pace before and now, so the percent beside it reads. */
function weeklyChange(before: number, now: number): string {
  const side = (value: number) => (value < 1 ? "<1" : `${value}`);
  return `${side(before)} → ${side(now)}/week`;
}

function signalFor(c: SlowCandidate): { signal: string; context: string } {
  if (c.kind === "drop") {
    return {
      signal: `-${dropPct(c)}%`,
      context: weeklyChange(perWeek(c.previousUnits), c.perWeek),
    };
  }
  if (c.kind === "no-sales") {
    return {
      signal: "No sales",
      context:
        c.previousUnits > 0
          ? `${whole(c.previousUnits)} sold the month before`
          : `None in ${SECTION_WINDOW_DAYS * 2} days`,
    };
  }
  return { signal: "Low seller", context: weekly(c.perWeek) };
}

/**
 * The model's answer joined back onto the app's facts.
 *
 * An entry whose ref is not one the app sent is dropped, as is a second entry
 * for the same ref, so a card can only ever describe an item the app flagged,
 * under its real name and with its real figures.
 */
export function parseSlowItems(
  value: unknown,
  candidates: SlowCandidate[],
  idPrefix: string,
): SlowItemInsight[] {
  const list = (value as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return [];

  const byRef = new Map(candidates.map((c) => [c.ref, c]));
  const seen = new Set<string>();
  const out: SlowItemInsight[] = [];

  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof e.ref === "string" ? e.ref.trim() : "";
    const candidate = byRef.get(ref);
    if (!candidate || seen.has(ref)) continue;

    const description = textOr(e.description, 220);
    const tip = textOr(e.tip, 300);
    const action = textOr(e.action, 40);
    const move = MOVES.includes(e.move as SlowItemMove)
      ? (e.move as SlowItemMove)
      : null;
    if (!description || !tip || !action || !move) continue;

    seen.add(ref);
    out.push({
      id: `${idPrefix}-${ref}`,
      productId: candidate.productId,
      icon: emojiOr(e.icon, "🍽️"),
      name: candidate.name,
      kind: candidate.kind,
      ...signalFor(candidate),
      description,
      tip,
      action,
      move,
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export type SlowItemsResult = AiSectionResult<SlowItemInsight>;
