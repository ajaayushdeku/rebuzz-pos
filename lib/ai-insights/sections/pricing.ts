/**
 * Pricing Opportunities on the AI Insights page.
 *
 * The POS keeps no price history, but its sales report splits an item into one
 * row per price it sold at. Asked for one week at a time, it becomes a
 * timeline: which menu price each item sold at, week by week, how many, and
 * with how much discount. That is enough to see what happened after a price
 * change, and whether a discount earns its keep.
 *
 * Reading a row:
 * - `price` is what the customer paid per unit, after any discount and before
 *   tax (`price × count` is the row's pre-tax sales).
 * - The menu price is `price + itemDiscount ÷ count`. Two rows with the same
 *   menu price and different `price` are a discount, not a price change.
 *
 * Traps in the real data, handled below:
 * - Variants carry their own prices. Items are compared by exact name, so a
 *   small Coke is never read as a price cut on a large one.
 * - A tax-inclusive sale stores its price without tax (Rs 400 sells as
 *   353.98), which would look like a cut. A row whose tax-inclusive price
 *   matches the item's usual menu price is counted at that price.
 * - Mistyped cost prices (a Momo at cost Rs 1,500) are outvoted: an item's
 *   cost is the one most of its units were sold at.
 *
 * The app works out every figure and the verdict; the model explains it and
 * proposes a price or a discount, which is checked against cost here.
 *
 * Pure functions only, so all of it can be tested without a session.
 */

import {
  formatMoney,
  menuMarginPct,
  normalizeName,
  num,
  round1,
  shiftIsoDate,
  textOr,
  emojiOr,
  type AiSectionResult,
  type DateWindow,
  type MenuProduct,
  type SalesByItemRow,
} from "./shared";

/** Part of the cache key: bump when the prompt or the facts change. */
export const PRICING_VERSION = "v2";

/** Thirteen weeks: about three months of weekly timeline. */
export const PRICING_WEEKS = 13;

/** Weeks of history on each side of a change before it is judged. */
const MIN_WEEKS_EACH_SIDE = 2;
/** Units sold before a change, for the comparison to mean anything. */
const MIN_UNITS_BEFORE = 5;
/** A discount matters once this share of an item's units carried one. */
const DISCOUNT_SHARE_PCT = 30;
const MIN_DISCOUNT_UNITS = 5;
/** Below this margin an item is flagged even when it sells at a profit. */
const LOW_MARGIN_PCT = 15;
const MAX_CANDIDATES = 6;

/**
 * The weekly windows, oldest first, each ending the day before the next
 * begins. The newest ends yesterday: today is still being sold and would read
 * as a slow week.
 */
export function pricingWeeks(today: string): DateWindow[] {
  const weeks: DateWindow[] = [];
  for (let i = PRICING_WEEKS - 1; i >= 0; i--) {
    const endDate = shiftIsoDate(today, -1 - 7 * i);
    weeks.push({ startDate: shiftIsoDate(endDate, -6), endDate });
  }
  return weeks;
}

// ── Reading the weekly report ─────────────────────────────────────────────

interface Sold {
  units: number;
  /** What customers paid, before tax. */
  sales: number;
  /** Units that carried a discount. */
  discountedUnits: number;
  discount: number;
  /** Units at each menu price. */
  byList: Map<number, number>;
  /** Units at each cost price. */
  byCost: Map<number, number>;
  /**
   * Sales minus cost, using the cost recorded on each sale. Costs change
   * along with prices (Pork Buns went from cost Rs 20 to Rs 30 when its price
   * rose), so one cost for every week would misstate one side of a change.
   */
  profit: number;
  /** A sale in this week had no cost price, so `profit` is incomplete. */
  costMissing: boolean;
}

interface ItemHistory {
  name: string;
  /** One entry per week, oldest first; units 0 when it did not sell. */
  weeks: Sold[];
  /** The cost most of its units were sold at. */
  cost: number;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

const emptySold = (): Sold => ({
  units: 0,
  sales: 0,
  discountedUnits: 0,
  discount: 0,
  byList: new Map(),
  byCost: new Map(),
  profit: 0,
  costMissing: false,
});

/** The key with the most units, e.g. the menu price most units sold at. */
function mostUnits(map: Map<number, number>): number | null {
  let best: number | null = null;
  let bestUnits = -1;
  for (const [key, units] of map) {
    if (units > bestUnits) {
      best = key;
      bestUnits = units;
    }
  }
  return best;
}

/**
 * "Coke (small · cherry) [small · cherry]" as "Coke (small · cherry)".
 *
 * The POS writes a variant's options twice, once in each kind of bracket; the
 * second copy adds nothing to a card title.
 */
export function tidyName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  const match = /^(.*?)\s*\((.+)\)\s*\[(.+)\]$/.exec(name);
  return match && normalizeName(match[2]) === normalizeName(match[3])
    ? `${match[1]} (${match[2]})`
    : name;
}

export function buildHistories(weeklyRows: SalesByItemRow[][]): ItemHistory[] {
  const items = new Map<string, ItemHistory>();

  // First pass: every item's menu prices, to recognise tax-inclusive rows,
  // and its usual cost, to recognise a mistyped one.
  const listsByItem = new Map<string, Map<number, number>>();
  const costsByItem = new Map<string, Map<number, number>>();
  for (const rows of weeklyRows) {
    for (const row of rows) {
      const units = num(row.count);
      if (units <= 0 || !row.itemName) continue;
      const key = normalizeName(row.itemName);
      const list = round2(num(row.price) + num(row.itemDiscount) / units);
      const lists = listsByItem.get(key) ?? new Map<number, number>();
      lists.set(list, (lists.get(list) ?? 0) + units);
      listsByItem.set(key, lists);
      const cost = num(row.costPrice);
      const costs = costsByItem.get(key) ?? new Map<number, number>();
      costs.set(cost, (costs.get(cost) ?? 0) + units);
      costsByItem.set(key, costs);
    }
  }
  const usualCost = (key: string) =>
    mostUnits(costsByItem.get(key) ?? new Map()) ?? 0;

  weeklyRows.forEach((rows, week) => {
    for (const row of rows) {
      const units = num(row.count);
      if (units <= 0 || !row.itemName) continue;
      const key = normalizeName(row.itemName);
      const discount = num(row.itemDiscount);
      let list = round2(num(row.price) + discount / units);

      // A tax-inclusive sale: what the customer paid per unit, tax and all,
      // is another of this item's menu prices. Count it at that price.
      const paid = round2(num(row.totalRevenue) / units);
      const known = listsByItem.get(key);
      if (discount === 0 && known && paid !== list) {
        for (const [other, otherUnits] of known) {
          if (
            other !== list &&
            Math.abs(other - paid) < 0.5 &&
            otherUnits > units
          ) {
            list = other;
            break;
          }
        }
      }

      const history = items.get(key) ?? {
        name: tidyName(row.itemName),
        weeks: weeklyRows.map(() => emptySold()),
        cost: 0,
      };
      const sold = history.weeks[week];
      const sales = num(row.totalRevenue) - num(row.totalTax);
      sold.units += units;
      sold.sales += sales;
      // The cost on the sale, unless it is far off the usual one: a cost ten
      // times the price is a typing slip, not what the item cost that week.
      const usual = usualCost(key);
      const recorded = num(row.costPrice);
      const unitCost =
        recorded > 0 && (usual <= 0 || recorded <= usual * 3)
          ? recorded
          : usual;
      if (unitCost > 0) sold.profit += sales - unitCost * units;
      else sold.costMissing = true;
      sold.discount += discount;
      if (discount > 0) sold.discountedUnits += units;
      sold.byList.set(list, (sold.byList.get(list) ?? 0) + units);
      const cost = num(row.costPrice);
      sold.byCost.set(cost, (sold.byCost.get(cost) ?? 0) + units);
      items.set(key, history);
    }
  });

  for (const history of items.values()) {
    const costs = new Map<number, number>();
    for (const w of history.weeks) {
      for (const [cost, units] of w.byCost) {
        costs.set(cost, (costs.get(cost) ?? 0) + units);
      }
    }
    history.cost = mostUnits(costs) ?? 0;
  }
  return [...items.values()];
}

// ── Facts ─────────────────────────────────────────────────────────────────

export type PricingKind =
  "price-change" | "just-changed" | "discount" | "below-cost" | "low-margin";

interface Base {
  /** From the item's name, so it names the same item all day. */
  ref: string;
  name: string;
  kind: PricingKind;
  /** The cost most units sold at; 0 when none was entered. */
  cost: number;
  /** The menu price today, or the latest one it sold at. */
  price: number;
}

export interface PriceChangeFacts extends Base {
  kind: "price-change";
  oldPrice: number;
  /** First week at the new price, as its start date. */
  changedWeekOf: string;
  weeksBefore: number;
  weeksAfter: number;
  unitsPerWeekBefore: number;
  unitsPerWeekAfter: number;
  profitPerWeekBefore: number | null;
  profitPerWeekAfter: number | null;
  unitsChangePct: number | null;
  profitChangePct: number | null;
}

export interface JustChangedFacts extends Base {
  kind: "just-changed";
  oldPrice: number;
  /** Units sold at the new price so far. */
  unitsSince: number;
}

export interface DiscountFacts extends Base {
  kind: "discount";
  discountedSharePct: number;
  /** Average discount per discounted unit. */
  avgDiscount: number;
  profitPerUnitFull: number | null;
  profitPerUnitDiscounted: number | null;
  /** Units a week in weeks mostly sold with a discount, and without. */
  unitsPerWeekDiscounted: number | null;
  unitsPerWeekFull: number | null;
  unitsPerWeek: number;
}

export interface MarginFacts extends Base {
  kind: "below-cost" | "low-margin";
  marginPct: number;
  profitPerUnit: number;
  unitsPerWeek: number;
}

export type PricingCandidate =
  PriceChangeFacts | JustChangedFacts | DiscountFacts | MarginFacts;

export interface PricingFacts {
  weeks: DateWindow[];
  itemsSold: number;
  candidates: PricingCandidate[];
}

function stableRef(name: string): string {
  let h = 0;
  for (const ch of normalizeName(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `i${h.toString(36).slice(0, 6)}`;
}

const perWeek = (units: number, weeks: number) =>
  weeks > 0 ? round1(units / weeks) : 0;

function pct(after: number, before: number): number | null {
  return before > 0 ? round1(((after - before) / before) * 100) : null;
}

/**
 * The latest price change still in force, with the weeks on each side.
 *
 * Weeks with no sales carry no price, so the change is found between the
 * weeks that sold, then measured over the calendar weeks between them — a
 * week with no sales counts as a week that sold nothing.
 */
function findPriceChange(
  history: ItemHistory,
  weeks: DateWindow[],
): (Omit<PriceChangeFacts, keyof Base> & { price: number }) | null {
  const listed = history.weeks.map((w) => mostUnits(w.byList));
  const selling = listed
    .map((list, week) => ({ list, week }))
    .filter((w): w is { list: number; week: number } => w.list !== null);
  if (selling.length < 2) return null;

  const latest = selling[selling.length - 1].list;
  // Walk back through the weeks still at today's price.
  let i = selling.length - 1;
  while (i > 0 && selling[i - 1].list === latest) i--;
  if (i === 0) return null;

  const changeWeek = selling[i].week;
  const oldPrice = selling[i - 1].list;
  let j = i - 1;
  while (j > 0 && selling[j - 1].list === oldPrice) j--;
  const beforeStart = selling[j].week;

  const before = history.weeks.slice(beforeStart, changeWeek);
  const after = history.weeks.slice(changeWeek);
  const sum = (ws: Sold[], f: (w: Sold) => number) =>
    ws.reduce((s, w) => s + f(w), 0);

  const unitsBefore = sum(before, (w) => w.units);
  const unitsAfter = sum(after, (w) => w.units);
  const profit = (ws: Sold[]) =>
    ws.some((w) => w.costMissing) ? null : sum(ws, (w) => w.profit);
  const pb = profit(before);
  const pa = profit(after);

  const upwBefore = perWeek(unitsBefore, before.length);
  const upwAfter = perWeek(unitsAfter, after.length);
  const ppwBefore = pb === null ? null : Math.round(pb / before.length);
  const ppwAfter = pa === null ? null : Math.round(pa / after.length);

  return {
    price: latest,
    oldPrice,
    changedWeekOf: weeks[changeWeek].startDate,
    weeksBefore: before.length,
    weeksAfter: after.length,
    unitsPerWeekBefore: upwBefore,
    unitsPerWeekAfter: upwAfter,
    profitPerWeekBefore: ppwBefore,
    profitPerWeekAfter: ppwAfter,
    unitsChangePct: pct(upwAfter, upwBefore),
    profitChangePct:
      ppwBefore !== null && ppwAfter !== null && ppwBefore > 0
        ? pct(ppwAfter, ppwBefore)
        : null,
  };
}

export function buildPricingFacts(
  weeklyRows: SalesByItemRow[][],
  menu: MenuProduct[],
  weeks: DateWindow[],
): PricingFacts {
  const histories = buildHistories(weeklyRows);
  const menuByName = new Map(
    menu.filter((p) => p.isAvailable).map((p) => [normalizeName(p.name), p]),
  );

  const changes: PricingCandidate[] = [];
  const watching: PricingCandidate[] = [];
  const discounts: PricingCandidate[] = [];
  const margins: PricingCandidate[] = [];
  const recent = Math.min(4, weeks.length); // the last four weeks

  for (const h of histories) {
    const product = menuByName.get(normalizeName(h.name));
    const totalUnits = h.weeks.reduce((s, w) => s + w.units, 0);
    const lastWeeks = h.weeks.slice(-recent);
    const recentUnits = lastWeeks.reduce((s, w) => s + w.units, 0);
    const lastList =
      [...h.weeks]
        .reverse()
        .map((w) => mostUnits(w.byList))
        .find((l) => l !== null) ?? 0;
    const base = {
      ref: stableRef(h.name),
      name: h.name,
      // Today's cost from the menu when it has one: the price being judged
      // is today's, so the cost beside it should be too.
      cost:
        product?.costPrice && product.costPrice > 0
          ? product.costPrice
          : h.cost,
      price: lastList,
    };

    // ── A price change already in force ──
    const change = findPriceChange(h, weeks);
    if (change) {
      const beforeUnits = change.unitsPerWeekBefore * change.weeksBefore;
      if (
        change.weeksBefore >= MIN_WEEKS_EACH_SIDE &&
        change.weeksAfter >= MIN_WEEKS_EACH_SIDE &&
        beforeUnits >= MIN_UNITS_BEFORE
      ) {
        changes.push({ ...base, kind: "price-change", ...change });
      } else {
        // Too recent to judge: said so, rather than left out.
        watching.push({
          ...base,
          kind: "just-changed",
          price: change.price,
          oldPrice: change.oldPrice,
          unitsSince: Math.round(change.unitsPerWeekAfter * change.weeksAfter),
        });
      }
    }

    // ── A menu price changed since the last sale ──
    // Only for a product sold under its own name: a variant's price is not
    // the product's.
    if (
      !change &&
      product &&
      product.price > 0 &&
      lastList > 0 &&
      Math.abs(product.price - lastList) >= 0.5
    ) {
      watching.push({
        ...base,
        kind: "just-changed",
        price: product.price,
        oldPrice: lastList,
        unitsSince: 0,
      });
    }

    // ── Discounts ──
    const discountedUnits = h.weeks.reduce((s, w) => s + w.discountedUnits, 0);
    if (
      totalUnits > 0 &&
      discountedUnits >= MIN_DISCOUNT_UNITS &&
      (discountedUnits / totalUnits) * 100 >= DISCOUNT_SHARE_PCT
    ) {
      const discount = h.weeks.reduce((s, w) => s + w.discount, 0);
      const avgDiscount = discount / discountedUnits;
      const withDiscount = h.weeks.filter(
        (w) => w.units > 0 && w.discountedUnits / w.units >= 0.5,
      );
      const without = h.weeks.filter(
        (w) => w.units > 0 && w.discountedUnits === 0,
      );
      discounts.push({
        ...base,
        kind: "discount",
        discountedSharePct: Math.round((discountedUnits / totalUnits) * 100),
        avgDiscount: Math.round(avgDiscount),
        profitPerUnitFull:
          base.cost > 0 ? Math.round(lastList - base.cost) : null,
        profitPerUnitDiscounted:
          base.cost > 0 ? Math.round(lastList - avgDiscount - base.cost) : null,
        unitsPerWeekDiscounted:
          withDiscount.length >= MIN_WEEKS_EACH_SIDE
            ? perWeek(
                withDiscount.reduce((s, w) => s + w.units, 0),
                withDiscount.length,
              )
            : null,
        unitsPerWeekFull:
          without.length >= MIN_WEEKS_EACH_SIDE
            ? perWeek(
                without.reduce((s, w) => s + w.units, 0),
                without.length,
              )
            : null,
        unitsPerWeek: perWeek(totalUnits, weeks.length),
      });
    }

    // ── Margin, at the price it sells at today ──
    const price =
      product?.price && product.price > 0 ? product.price : lastList;
    const cost =
      product?.costPrice && product.costPrice > 0 ? product.costPrice : h.cost;
    if (recentUnits > 0 && price > 0 && cost > 0) {
      const margin = product
        ? menuMarginPct({ ...product, price, costPrice: cost })
        : round1(((price - cost) / price) * 100);
      if (margin !== null && margin < LOW_MARGIN_PCT) {
        margins.push({
          ...base,
          kind: margin < 0 ? "below-cost" : "low-margin",
          price,
          cost,
          marginPct: margin,
          profitPerUnit: Math.round(price - cost),
          unitsPerWeek: perWeek(recentUnits, recent),
        });
      }
    }
  }

  // Worst first within each kind.
  const lostProfit = (c: PricingCandidate) =>
    c.kind === "price-change"
      ? -Math.abs((c.profitPerWeekAfter ?? 0) - (c.profitPerWeekBefore ?? 0))
      : 0;
  changes.sort((a, b) => lostProfit(a) - lostProfit(b));
  discounts.sort(
    (a, b) =>
      (b as DiscountFacts).discountedSharePct -
      (a as DiscountFacts).discountedSharePct,
  );
  margins.sort(
    (a, b) => (a as MarginFacts).marginPct - (b as MarginFacts).marginPct,
  );

  // One card per item, in order of what the owner most needs to hear:
  // changes that already happened, discounts, prices below cost, and
  // changes still too new to judge.
  // Also one card per product: its sizes and flavours sell under their own
  // names, and three cards about the same Coke discount say one thing.
  const productOf = (name: string) =>
    normalizeName(name.split(/[[(]/)[0] ?? name);
  const seen = new Set<string>();
  const candidates: PricingCandidate[] = [];
  for (const c of [
    ...changes,
    ...margins.filter((m) => m.kind === "below-cost"),
    ...discounts,
    ...margins.filter((m) => m.kind === "low-margin"),
    ...watching,
  ]) {
    if (candidates.length >= MAX_CANDIDATES) break;
    const product = productOf(c.name);
    if (seen.has(product)) continue;
    seen.add(product);
    candidates.push(c);
  }

  return { weeks, itemsSold: histories.length, candidates };
}

// ── Briefing ──────────────────────────────────────────────────────────────

function describe(c: PricingCandidate, money: (v: number) => string): string {
  const costText = c.cost > 0 ? `cost ${money(c.cost)}` : "no cost price set";
  switch (c.kind) {
    case "price-change":
      return [
        `price changed ${money(c.oldPrice)} → ${money(c.price)} in the week of ${c.changedWeekOf}`,
        `sold ${c.unitsPerWeekBefore} a week over ${c.weeksBefore} weeks before, ${c.unitsPerWeekAfter} a week over ${c.weeksAfter} weeks after${c.unitsChangePct !== null ? ` (${c.unitsChangePct > 0 ? "+" : ""}${c.unitsChangePct}%)` : ""}`,
        c.profitPerWeekBefore !== null && c.profitPerWeekAfter !== null
          ? `profit ${money(c.profitPerWeekBefore)} a week before, ${money(c.profitPerWeekAfter)} after${c.profitChangePct !== null ? ` (${c.profitChangePct > 0 ? "+" : ""}${c.profitChangePct}%)` : ""}`
          : "profit unknown (no cost price)",
        costText,
      ].join(" · ");
    case "just-changed":
      return `menu price changed ${money(c.oldPrice)} → ${money(c.price)} recently; ${c.unitsSince} sold at the new price so far, too early to judge · ${costText}`;
    case "discount":
      return [
        `${c.discountedSharePct}% of units sold with a discount, averaging ${money(c.avgDiscount)} off a ${money(c.price)} menu price`,
        c.profitPerUnitFull !== null && c.profitPerUnitDiscounted !== null
          ? `profit per unit ${money(c.profitPerUnitFull)} at full price, ${money(c.profitPerUnitDiscounted)} discounted`
          : "profit unknown (no cost price)",
        c.unitsPerWeekDiscounted !== null && c.unitsPerWeekFull !== null
          ? `${c.unitsPerWeekDiscounted} a week in discounted weeks vs ${c.unitsPerWeekFull} in full-price weeks`
          : `${c.unitsPerWeek} sold a week; not enough full-price weeks to compare`,
        costText,
      ].join(" · ");
    case "below-cost":
    case "low-margin":
      return `price ${money(c.price)}, ${costText}, margin ${c.marginPct}% (${money(c.profitPerUnit)} a unit), ${c.unitsPerWeek} sold a week lately`;
  }
}

const KIND_WORDS: Record<PricingKind, string> = {
  "price-change": "price change to judge",
  "just-changed": "price change too new to judge",
  discount: "discount to review",
  "below-cost": "sells below cost",
  "low-margin": "very thin margin",
};

export function pricingBriefing(
  facts: PricingFacts,
  currencySymbol: string,
): string {
  const money = (value: number) => formatMoney(currencySymbol, value);
  const first = facts.weeks[0];
  const last = facts.weeks[facts.weeks.length - 1];
  return [
    `Weekly sales from ${first.startDate} to ${last.endDate} (${facts.weeks.length} weeks). Prices are menu prices before tax, in ${currencySymbol}; profit is what customers paid minus cost.`,
    `${facts.itemsSold} items sold in that time.`,
    "",
    "Items to write about (ref · item · why · facts):",
    ...facts.candidates.map(
      (c) =>
        `- ${c.ref} · ${c.name} · ${KIND_WORDS[c.kind]} · ${describe(c, money)}`,
    ),
  ].join("\n");
}

// ── Instructions and answer format ────────────────────────────────────────

export const PRICING_PROMPT = `You advise the owner of a small shop, café or restaurant in Nepal that uses the Rebuzz POS on prices and discounts. The app has worked out, from weekly sales, what happened after each price change, how each discount is used, and which items sell below cost or at a very thin margin.

For each item, write:
- ref: the item's ref exactly as given.
- icon: one emoji for the item.
- verdict: what the facts show, in one sentence under 150 characters, quoting only figures from the facts.
- advice: what to do, in one or two sentences under 220 characters.
- suggestedPrice: a whole-number menu price to try, or 0 to keep the price as it is.
- suggestedDiscount: a whole-number discount per unit to use instead of the current one, 0 to stop discounting, or -1 when the item has no discount to review.

Rules:
- A price change: judge it by profit a week first, units second. If profit rose, say keep it. If profit fell, suggest going back or a price in between.
- Too new to judge: say when it will be clear (after about two weeks of sales), and suggest price 0.
- A discount: if discounted weeks do not sell clearly more, suggest a smaller discount or none. Never suggest a discount that sells below cost.
- Below cost or a thin margin: suggest a price that covers cost with a sensible margin, rounded to a price people are used to paying.
- Never invent sales forecasts, percentages or figures that are not in the facts.
- Plain words for a busy owner. No markdown. The only emoji goes in icon.`;

export const PRICING_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          icon: { type: "string" },
          verdict: { type: "string" },
          advice: { type: "string" },
          suggestedPrice: { type: "number" },
          suggestedDiscount: { type: "number" },
        },
        required: [
          "ref",
          "icon",
          "verdict",
          "advice",
          "suggestedPrice",
          "suggestedDiscount",
        ],
      },
    },
  },
  required: ["items"],
} as const;

// ── Answer ────────────────────────────────────────────────────────────────

export interface PricingInsight {
  id: string;
  icon: string;
  verdict: string;
  advice: string;
  /** The model's price, kept only when it covers cost and differs from now. */
  suggestedPrice: number | null;
  /** The model's discount, kept only when the discounted price covers cost. */
  suggestedDiscount: number | null;
  /**
   * For a suggested price: how far sales could fall (negative) or must rise
   * (positive), in percent, for profit to stay where it is. Null without a
   * cost price, or when the price does not change.
   */
  breakEvenUnitsPct: number | null;
  facts: PricingCandidate;
}

/**
 * Units change that keeps profit the same when moving from `from` to `to`.
 *
 * Profit a unit is price minus cost, so the same profit needs
 * `(from − cost) ÷ (to − cost)` times the units: at a higher price that is
 * fewer, at a lower one more.
 */
export function breakEvenUnitsPct(
  from: number,
  to: number,
  cost: number,
): number | null {
  if (cost <= 0 || from <= cost || to <= cost || from === to) return null;
  return round1(((from - cost) / (to - cost) - 1) * 100);
}

/**
 * The model's notes joined onto the app's facts.
 *
 * A ref the app did not send is dropped. A suggested price at or below cost,
 * or the same as today's, is dropped; so is a discount that would sell below
 * cost. Cards keep the app's order.
 */
export function parsePricing(
  value: unknown,
  facts: PricingFacts,
  idPrefix: string,
): PricingInsight[] {
  const list = (value as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return [];

  const notes = new Map<string, Record<string, unknown>>();
  for (const entry of list) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const ref = typeof e.ref === "string" ? e.ref.trim() : "";
    if (ref && !notes.has(ref)) notes.set(ref, e);
  }

  return facts.candidates.flatMap((c) => {
    const e = notes.get(c.ref);
    if (!e) return [];
    const verdict = textOr(e.verdict, 220);
    const advice = textOr(e.advice, 320);
    if (!verdict || !advice) return [];

    const rawPrice = num(e.suggestedPrice);
    const price = Math.round(rawPrice);
    const suggestedPrice =
      price > 0 &&
      price !== Math.round(c.price) &&
      (c.cost <= 0 || price > c.cost)
        ? price
        : null;

    const rawDiscount = num(e.suggestedDiscount);
    const discount = Math.round(rawDiscount);
    const suggestedDiscount =
      c.kind === "discount" &&
      discount >= 0 &&
      (c.cost <= 0 || c.price - discount > c.cost)
        ? discount
        : null;

    return [
      {
        id: `${idPrefix}-${c.ref}`,
        icon: emojiOr(e.icon, "🏷️"),
        verdict,
        advice,
        suggestedPrice,
        suggestedDiscount,
        breakEvenUnitsPct:
          suggestedPrice !== null
            ? breakEvenUnitsPct(c.price, suggestedPrice, c.cost)
            : null,
        facts: c,
      },
    ];
  });
}

export type PricingResult = AiSectionResult<PricingInsight>;
