/**
 * AI Menu Suggestions on the AI Insights page.
 *
 * What the POS can and cannot back up decides the shape of an idea:
 *
 * - It knows what sells, at what margin, and the whole menu with prices, costs
 *   and descriptions. So every idea must be built from items really on the
 *   menu, named exactly, and those names are checked here against the menu.
 * - It has no recipes (the composite-items feature is unused), so there is no
 *   ingredient list to show.
 * - A new item has no sales yet, so there is no honest "extra per week" to
 *   quote, and a model rating its own confidence measures nothing. Neither is
 *   asked for.
 *
 * The one number the model proposes is a price to try, and it is checked
 * against the real cost of the items a combo is made from.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import {
  formatMoney,
  SECTION_WINDOW_DAYS,
  emojiOr,
  menuMarginPct,
  normalizeName,
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
export const MENU_SUGGESTIONS_VERSION = "v1";

// ── Facts ─────────────────────────────────────────────────────────────────

export interface MenuLine {
  name: string;
  category: string | null;
  price: number;
  costPrice: number;
  marginPct: number | null;
  units: number;
  perWeek: number;
  description: string;
  variantNames: string[];
}

export interface MenuFacts {
  windows: SalesWindows;
  totalUnits: number;
  bestSellers: MenuLine[];
  /** The rest of the menu, best selling first. */
  menu: MenuLine[];
  /** Items on the menu not listed, when the menu is very long. */
  otherItems: number;
  categories: { name: string; units: number; sharePct: number }[];
}

const BEST_SELLERS = 8;
/** Enough for the model to know the menu without the briefing ballooning. */
const MAX_MENU_LINES = 60;

export function buildMenuFacts(
  menu: MenuProduct[],
  current: SalesByItemRow[],
  windows: SalesWindows,
): MenuFacts {
  const now = salesByProduct(current, productMatcher(menu));
  const onMenu = menu.filter((p) => p.isAvailable && p.price > 0);

  const lines: MenuLine[] = onMenu
    .map((p) => {
      const units = now.get(p.id)?.units ?? 0;
      return {
        name: p.name,
        category: p.categoryName,
        price: p.price,
        costPrice: p.costPrice,
        marginPct: menuMarginPct(p),
        units,
        perWeek: perWeek(units),
        description: p.description,
        variantNames: p.variantNames,
      };
    })
    .sort((a, b) => b.units - a.units || a.name.localeCompare(b.name));

  const totalUnits = lines.reduce((sum, l) => sum + l.units, 0);
  const bestSellers = lines.filter((l) => l.units > 0).slice(0, BEST_SELLERS);
  const rest = lines.filter((l) => !bestSellers.includes(l));

  const byCategory = new Map<string, number>();
  for (const l of lines) {
    const name = l.category ?? "Uncategorised";
    byCategory.set(name, (byCategory.get(name) ?? 0) + l.units);
  }

  return {
    windows,
    totalUnits,
    bestSellers,
    menu: rest.slice(0, MAX_MENU_LINES),
    otherItems: Math.max(0, rest.length - MAX_MENU_LINES),
    categories: [...byCategory.entries()]
      .map(([name, units]) => ({
        name,
        units,
        sharePct:
          totalUnits > 0 ? Math.round((units / totalUnits) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.units - a.units),
  };
}

// ── Briefing ──────────────────────────────────────────────────────────────

export function menuBriefing(facts: MenuFacts, currencySymbol: string): string {
  const money = (value: number) => formatMoney(currencySymbol, value);
  const { current } = facts.windows;

  const describe = (l: MenuLine, withSales: boolean) => {
    const parts = [
      `${l.name}${l.category ? ` [${l.category}]` : ""}`,
      l.marginPct === null
        ? `price ${money(l.price)}, cost unknown`
        : `price ${money(l.price)}, cost ${money(l.costPrice)}, margin ${l.marginPct}%`,
    ];
    if (withSales) parts.push(`${whole(l.units)} sold, ${l.perWeek} a week`);
    if (l.variantNames.length > 0) {
      parts.push(`options: ${l.variantNames.slice(0, 6).join(", ")}`);
    }
    if (l.description) parts.push(`"${l.description.slice(0, 80)}"`);
    return `- ${parts.join(" · ")}`;
  };

  const lines = [
    `Window: last ${SECTION_WINDOW_DAYS} days, ${current.startDate} to ${current.endDate}.`,
    `Prices are menu prices before tax, in ${currencySymbol}. ${whole(facts.totalUnits)} units sold in the window.`,
    "",
    "Categories (units sold · share):",
    ...facts.categories.map(
      (c) => `- ${c.name}: ${whole(c.units)} · ${c.sharePct}%`,
    ),
    "",
    "Best sellers:",
    ...facts.bestSellers.map((l) => describe(l, true)),
    "",
    "Rest of the menu:",
    ...(facts.menu.length > 0
      ? facts.menu.map((l) => describe(l, l.units > 0))
      : ["- none"]),
  ];
  if (facts.otherItems > 0) {
    lines.push(`(${facts.otherItems} more menu items not listed.)`);
  }
  return lines.join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const MENU_SUGGESTIONS_PROMPT = `You help the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS decide what to add to the menu. You receive the current menu with prices, costs and descriptions, and what sold best in the last 30 days.

Suggest 3 menu ideas built on what already sells.

Each idea is one of:
- "combo": two or more existing menu items sold together at one price.
- "new-item": a new dish or drink that is a variation of a best seller, using what that kitchen already makes.
- "add-on": a small extra offered with a best seller.

For each idea:
- icon: one emoji.
- title: a short menu name, under 40 characters. Not a name already on the menu.
- kind: "combo", "new-item" or "add-on".
- difficulty: "Easy" (uses menu items as they are), "Medium" (a small change in prep), "Hard" (new ingredients or equipment).
- description: one or two sentences on why it should sell, under 220 characters. Base it on the best sellers and quote only figures from the facts.
- builtFrom: the existing menu items the idea uses, each written exactly as it appears in the menu. At least one.
- suggestedPrice: a whole-number price in the currency given. For a combo, below the items' prices added together and above their costs added together.

Rules:
- Never invent sales figures, extra revenue, forecasts or percentages that are not in the facts.
- Do not suggest something the menu already has.
- Plain words for a busy owner. No markdown. The only emoji goes in icon.`;

export const MENU_SUGGESTIONS_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          icon: { type: "string" },
          title: { type: "string" },
          kind: { type: "string", enum: ["combo", "new-item", "add-on"] },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          description: { type: "string" },
          builtFrom: { type: "array", items: { type: "string" } },
          suggestedPrice: { type: "number" },
        },
        required: [
          "icon",
          "title",
          "kind",
          "difficulty",
          "description",
          "builtFrom",
          "suggestedPrice",
        ],
      },
    },
  },
  required: ["ideas"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export type Difficulty = "Easy" | "Medium" | "Hard";
export type MenuIdeaKind = "combo" | "new-item" | "add-on";

const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Medium", "Hard"];
const KINDS: readonly MenuIdeaKind[] = ["combo", "new-item", "add-on"];

export interface MenuSuggestion {
  id: string;
  icon: string;
  title: string;
  kind: MenuIdeaKind;
  difficulty: Difficulty;
  description: string;
  /** Real menu items, with their real prices. */
  builtFrom: { name: string; price: number }[];
  /** The model's price to try, dropped when it would sell below cost. */
  suggestedPrice: number | null;
  /** A combo's items bought one by one, from the menu's own prices. */
  separatePrice: number | null;
}

const MAX_IDEAS = 6;

/**
 * The model's ideas, kept only where they stand on the real menu.
 *
 * - Every `builtFrom` name must match a product on the menu; unknown names are
 *   removed, and an idea left with none is dropped — it would be an idea from
 *   nowhere.
 * - An idea named the same as something already on the menu is dropped.
 * - A combo's price is only shown when it covers what its items cost.
 */
export function parseMenuSuggestions(
  value: unknown,
  menu: MenuProduct[],
  idPrefix: string,
): MenuSuggestion[] {
  const list = (value as { ideas?: unknown } | null)?.ideas;
  if (!Array.isArray(list)) return [];

  const onMenu = menu.filter((p) => p.isAvailable && p.price > 0);
  const match = productMatcher(onMenu);
  const existing = new Set(menu.map((p) => normalizeName(p.name)));
  const out: MenuSuggestion[] = [];

  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const title = textOr(e.title, 60);
    const description = textOr(e.description, 320);
    const kind = KINDS.includes(e.kind as MenuIdeaKind)
      ? (e.kind as MenuIdeaKind)
      : null;
    const difficulty = DIFFICULTIES.includes(e.difficulty as Difficulty)
      ? (e.difficulty as Difficulty)
      : null;
    if (!title || !description || !kind || !difficulty) continue;
    if (existing.has(normalizeName(title))) continue;

    const products: MenuProduct[] = [];
    for (const name of Array.isArray(e.builtFrom) ? e.builtFrom : []) {
      if (typeof name !== "string") continue;
      const product = match(name);
      if (product && !products.includes(product)) products.push(product);
    }
    if (products.length === 0) continue;

    const isCombo = kind === "combo" && products.length >= 2;
    const separatePrice = isCombo
      ? products.reduce((sum, p) => sum + p.price, 0)
      : null;
    const costsKnown = products.every((p) => p.costPrice > 0);
    const combinedCost = products.reduce((sum, p) => sum + p.costPrice, 0);

    const rawPrice =
      typeof e.suggestedPrice === "number" && Number.isFinite(e.suggestedPrice)
        ? Math.round(e.suggestedPrice)
        : null;
    const suggestedPrice =
      rawPrice === null || rawPrice <= 0
        ? null
        : isCombo && costsKnown && rawPrice <= combinedCost
          ? null
          : rawPrice;

    out.push({
      id: `${idPrefix}-${out.length}`,
      icon: emojiOr(e.icon, "✨"),
      title,
      kind,
      difficulty,
      description,
      builtFrom: products.map((p) => ({ name: p.name, price: p.price })),
      suggestedPrice,
      separatePrice,
    });
    if (out.length >= MAX_IDEAS) break;
  }
  return out;
}

export type MenuSuggestionsResult = AiSectionResult<MenuSuggestion>;
