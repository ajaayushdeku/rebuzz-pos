import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";

export type Velocity = "fast" | "normal" | "slow";

/** Which metric drove the ranking. */
export type VelocityBasis = "sell-through" | "units";

export interface ItemMetrics {
  /** Units on hand right now, or null when the product isn't stock-tracked. */
  onHand: number | null;
  /** onHand + sold — the stock the period started with, assuming no restock. */
  openingStock: number | null;
  /** sold ÷ openingStock, 0–1, or null when stock is unknown. */
  sellThrough: number | null;
}

export interface VelocityResult {
  fast: MergedSalesItem[];
  normal: MergedSalesItem[];
  slow: MergedSalesItem[];
  /** Every item keyed by name → its class, for per-item lookups (bar colours). */
  byName: Map<string, Velocity>;
  /** Stock-derived figures keyed by name; empty in units mode. */
  metrics: Map<string, ItemMetrics>;
  /** Items ranked best-first on whichever basis was used. */
  ranked: MergedSalesItem[];
  basis: VelocityBasis;
  totalUnits: number;
  medianUnits: number;
  /** Median sell-through in sell-through mode, else null. */
  medianSellThrough: number | null;
}

/**
 * Share of total units that counts as "fast": items are ranked by quantity
 * sold and taken until they cover this much of everything sold. Standard ABC
 * inventory analysis uses 80%.
 */
const FAST_CUMULATIVE_SHARE = 0.8;

/** Items sitting in the final 5% of cumulative units are the slow tail. */
const SLOW_CUMULATIVE_SHARE = 0.95;

/** Sell-through thresholds, as multiples of the median rate. */
const FAST_RATE_MULTIPLE = 1.5;
const SLOW_RATE_MULTIPLE = 0.5;

/** Sell-through mode needs enough stock-tracked products to be meaningful. */
const MIN_STOCK_ITEMS = 3;
const MIN_STOCK_COVERAGE = 0.5;

const median = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const normalizeName = (name: string) => name.trim().toLowerCase();

/**
 * Units on hand for a product.
 *
 * Products with variants carry stock on the variants (the base row reads 0),
 * so those are summed. Products with `usesStocks` off aren't tracked at all
 * and return null rather than a misleading zero.
 */
function stockOnHand(product: InventoryItem): number | null {
  if (!product.usesStocks) return null;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (sum, v) => sum + (typeof v.inStock === "number" ? v.inStock : 0),
      0,
    );
  }

  return typeof product.inStock === "number" ? product.inStock : null;
}

/**
 * Classifies products by how fast they move.
 *
 * **With inventory** the basis is *sell-through*: `sold ÷ (onHand + sold)`.
 * This is what "fast moving" usually means to someone ordering stock — 350
 * sold out of 2,350 is a slow product sitting on a mountain of inventory,
 * while 350 sold out of 850 is one that needs reordering. Raw units can't
 * distinguish the two.
 *
 * **Without inventory** it falls back to share of total units sold, using
 * cumulative share (ABC analysis) rather than ratio-to-top-seller, since one
 * runaway product otherwise pushes the threshold above every other seller.
 *
 *   sell-through mode: fast ≥ 1.5× median rate, slow ≤ 0.5× median rate
 *   units mode:        fast within first 80% of cumulative units AND above
 *                      the median; slow within the last 5% AND at or below it
 *
 * Both are dynamic — the number of fast movers follows the data, and no rule
 * can collapse to "the single top seller".
 *
 * IMPORTANT: opening stock is inferred as `onHand + sold`, which is only
 * correct if nothing was restocked during the period. Any purchase, transfer
 * or stock correction inflates it and understates sell-through. It also
 * assumes `onHand` is current — pairing a stale date range with today's stock
 * gives meaningless rates. Treat it as an indicator, not an audit.
 */
export function classifySalesVelocity(
  sales: MergedSalesItem[],
  inventory?: InventoryItem[],
): VelocityResult {
  const byName = new Map<string, Velocity>();
  const metrics = new Map<string, ItemMetrics>();

  const empty: VelocityResult = {
    fast: [],
    normal: [],
    slow: [],
    byName,
    metrics,
    ranked: [],
    basis: "units",
    totalUnits: 0,
    medianUnits: 0,
    medianSellThrough: null,
  };

  if (sales.length === 0) return empty;

  const totalUnits = sales.reduce((sum, i) => sum + i.count, 0);
  const medianUnits = median(sales.map((i) => i.count));

  // Nothing sold in this range — every product is slow by definition.
  if (totalUnits <= 0) {
    const ranked = [...sales].sort((a, b) => b.count - a.count);
    for (const item of ranked) byName.set(item.name, "slow");
    return { ...empty, slow: ranked, ranked, totalUnits: 0, medianUnits };
  }

  // ── Stock lookup ────────────────────────────────────────────────────────
  const stockByName = new Map<string, number | null>();
  for (const product of inventory ?? []) {
    stockByName.set(normalizeName(product.name), stockOnHand(product));
  }

  let stockedCount = 0;
  for (const item of sales) {
    const onHand = stockByName.get(normalizeName(item.name)) ?? null;
    const openingStock = onHand === null ? null : onHand + item.count;
    const sellThrough =
      openingStock !== null && openingStock > 0
        ? item.count / openingStock
        : null;

    metrics.set(item.name, { onHand, openingStock, sellThrough });
    if (sellThrough !== null) stockedCount += 1;
  }

  const rates = sales
    .map((i) => metrics.get(i.name)?.sellThrough)
    .filter((r): r is number => r !== null && r !== undefined);

  const medianSellThrough = median(rates);

  const useSellThrough =
    stockedCount >= MIN_STOCK_ITEMS &&
    stockedCount / sales.length >= MIN_STOCK_COVERAGE &&
    medianSellThrough > 0;

  const fast: MergedSalesItem[] = [];
  const normal: MergedSalesItem[] = [];
  const slow: MergedSalesItem[] = [];

  if (useSellThrough) {
    const fastCut = medianSellThrough * FAST_RATE_MULTIPLE;
    const slowCut = medianSellThrough * SLOW_RATE_MULTIPLE;

    // Best sell-through first; untracked products sink to the bottom.
    const ranked = [...sales].sort(
      (a, b) =>
        (metrics.get(b.name)?.sellThrough ?? -1) -
        (metrics.get(a.name)?.sellThrough ?? -1),
    );

    for (const item of ranked) {
      const rate = metrics.get(item.name)?.sellThrough ?? null;

      // Untracked products can't be ranked on this basis — they sit in
      // neither panel rather than being guessed at.
      if (rate === null) {
        normal.push(item);
        byName.set(item.name, "normal");
      } else if (item.count > 0 && rate >= fastCut) {
        fast.push(item);
        byName.set(item.name, "fast");
      } else if (rate <= slowCut) {
        slow.push(item);
        byName.set(item.name, "slow");
      } else {
        normal.push(item);
        byName.set(item.name, "normal");
      }
    }

    return {
      fast,
      normal,
      slow,
      byName,
      metrics,
      ranked,
      basis: "sell-through",
      totalUnits,
      medianUnits,
      medianSellThrough,
    };
  }

  // ── Fallback: share of total units sold ─────────────────────────────────
  const ranked = [...sales].sort((a, b) => b.count - a.count);
  let cumulative = 0;

  for (const item of ranked) {
    const shareBefore = cumulative / totalUnits;
    cumulative += item.count;

    if (
      item.count > 0 &&
      shareBefore < FAST_CUMULATIVE_SHARE &&
      item.count > medianUnits
    ) {
      fast.push(item);
      byName.set(item.name, "fast");
    } else if (
      item.count === 0 ||
      (shareBefore >= SLOW_CUMULATIVE_SHARE && item.count <= medianUnits)
    ) {
      slow.push(item);
      byName.set(item.name, "slow");
    } else {
      normal.push(item);
      byName.set(item.name, "normal");
    }
  }

  return {
    fast,
    normal,
    slow,
    byName,
    metrics,
    ranked,
    basis: "units",
    totalUnits,
    medianUnits,
    medianSellThrough: null,
  };
}

/**
 * Profit margin over cost for a group of items, as a percentage.
 *
 * Products with no recorded costPrice report netProfit === totalRevenue, so
 * their cost reads as zero. Averaging those in with real costs inflates the
 * result wildly — on live data a group came out at +33,945% because a single
 * high-revenue item had no cost recorded. Only items with a known cost are
 * counted, and the result is null when none of them do, so callers can show
 * "—" rather than a fabricated number.
 */
export function marginOverCost(items: MergedSalesItem[]): number | null {
  const withCost = items.filter((i) => i.totalRevenue - i.netProfit > 0);
  if (withCost.length === 0) return null;

  const revenue = withCost.reduce((s, i) => s + i.totalRevenue, 0);
  const cost = withCost.reduce((s, i) => s + (i.totalRevenue - i.netProfit), 0);

  if (cost <= 0) return null;
  return Math.round(((revenue - cost) / cost) * 100);
}

/** How many items in a group have a usable cost price. */
export function itemsWithCost(items: MergedSalesItem[]): number {
  return items.filter((i) => i.totalRevenue - i.netProfit > 0).length;
}

/** Share of total units sold, as a percentage. */
export function unitShare(
  items: MergedSalesItem[],
  totalUnits: number,
): number {
  if (totalUnits <= 0) return 0;
  const units = items.reduce((s, i) => s + i.count, 0);
  return Math.round((units / totalUnits) * 100);
}
