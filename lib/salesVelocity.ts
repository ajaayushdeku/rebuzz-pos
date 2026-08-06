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
 * Order matters here. A product whose stock lives on its variants normally has
 * `usesStocks` FALSE on the parent row — there's nothing to track there, and
 * the base `inStock` reads 0. Testing that flag before looking at the variants
 * returns null for every such product, which drops it out of both panels.
 * Variants are checked first; the flag only governs products that have none.
 *
 * Returns null only when a product genuinely isn't tracked, so callers can
 * tell "not tracked" apart from "tracked, none left".
 */
function stockOnHand(product: InventoryItem): number | null {
  const variants = product.variants ?? [];

  if (variants.length > 0) {
    // Stock lives on the variants regardless of the parent's flag.
    const tracked = variants.filter((v) => typeof v.inStock === "number");
    if (tracked.length === 0) return null;
    return tracked.reduce((sum, v) => sum + v.inStock, 0);
  }

  if (!product.usesStocks) return null;
  return typeof product.inStock === "number" ? product.inStock : null;
}

interface VariantEntry {
  /** Option values reduced to sorted alphanumeric tokens, e.g. "buff". */
  tokens: string;
  stock: number | null;
}

interface ParentEntry {
  key: string;
  /** Sum across variants, or the product's own stock when it has none. */
  stock: number | null;
  variants: VariantEntry[];
}

interface StockIndex {
  /** Exact normalized name → stock. Parent names and expanded variant names. */
  exact: Map<string, number | null>;
  /** Parent products, longest name first, for prefix + option matching. */
  parents: ParentEntry[];
}

/**
 * Reduces a label to sorted alphanumeric tokens, so "Buff", " buff " and
 * "(BUFF)" all compare equal, and "Large · Red" matches "Red Large".
 */
function optionTokens(value: string): string {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/**
 * Maps every name a sales row might use → the stock behind it.
 *
 * Each variant carries its own stock, so a sales row naming a variant must
 * resolve to THAT variant, not to the product total. Summing would give every
 * variant of a product the same opening stock and understate each one's
 * sell-through — Buff and Veg momo would look identically fast.
 *
 * salesByItem doesn't document how it names a variant sale, so rather than
 * assume a separator the index keeps each variant's option values as tokens
 * and matches whatever follows the parent name against them.
 */
function buildStockIndex(inventory: InventoryItem[]): StockIndex {
  const exact = new Map<string, number | null>();
  const parents: ParentEntry[] = [];

  for (const product of inventory) {
    const parentKey = normalizeName(product.name);
    const variants: VariantEntry[] = [];

    for (const v of product.variants ?? []) {
      if (v.optionValues.length === 0) continue;

      const stock = typeof v.inStock === "number" ? v.inStock : null;
      const options = v.optionValues.join(" · ");

      variants.push({ tokens: optionTokens(options), stock });

      const variantKey = normalizeName(`${product.name} · ${options}`);
      if (variantKey !== parentKey) exact.set(variantKey, stock);
    }

    // Written last so no variant key can shadow it. A row named exactly the
    // parent means the whole product, so it gets the total.
    const stock = stockOnHand(product);
    exact.set(parentKey, stock);
    parents.push({ key: parentKey, stock, variants });
  }

  // Longest first so "Momo Special" wins over "Momo" for "momo special buff".
  parents.sort((a, b) => b.key.length - a.key.length);

  return { exact, parents };
}

type StockMatch =
  | { stock: number | null; matched: true }
  | { stock: null; matched: false; reason: "no-product" | "unknown-variant" };

/**
 * Stock for a sales row name.
 *
 * 1. Exact match — the parent name, or an expanded name in our own format.
 * 2. Longest parent name prefixing it at a word boundary. Whatever follows is
 *    tokenised and matched against that product's variants, so "Momo - Buff",
 *    "Momo (Buff)" and "Momo Buff" all land on the Buff variant's own stock.
 *    Nothing after the parent name means the product as a whole.
 *
 * A trailing label that matches no variant returns unmatched rather than
 * falling back to the product total — a wrong number here is worse than none,
 * since it silently inflates that row's opening stock.
 *
 * The boundary check is what stops "Coke" from claiming "Coke Zero".
 */
function resolveStock(name: string, index: StockIndex): StockMatch {
  const key = normalizeName(name);

  if (index.exact.has(key)) {
    return { stock: index.exact.get(key) ?? null, matched: true };
  }

  for (const parent of index.parents) {
    if (!key.startsWith(parent.key)) continue;

    const boundary = key.charAt(parent.key.length);
    // "" means an exact tail; anything non-alphanumeric is a separator.
    if (boundary !== "" && /[a-z0-9]/.test(boundary)) continue;

    const remainder = optionTokens(key.slice(parent.key.length));
    if (!remainder) return { stock: parent.stock, matched: true };

    const variant = parent.variants.find((v) => v.tokens === remainder);
    if (variant) return { stock: variant.stock, matched: true };

    return { stock: null, matched: false, reason: "unknown-variant" };
  }

  return { stock: null, matched: false, reason: "no-product" };
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
 * Variant products are ranked as one product, because that's how the sales API
 * reports them: all variants of a product share a name and are merged before
 * they arrive here, so their units and their stock are both summed.
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
  const stockIndex = buildStockIndex(inventory ?? []);
  const unmatched: string[] = [];

  let stockedCount = 0;
  for (const item of sales) {
    const match = resolveStock(item.name, stockIndex);
    const onHand = match.stock;
    if (!match.matched && stockIndex.parents.length > 0) {
      unmatched.push(`${item.name} (${match.reason})`);
    }

    const openingStock = onHand === null ? null : onHand + item.count;
    const sellThrough =
      openingStock !== null && openingStock > 0
        ? item.count / openingStock
        : null;

    metrics.set(item.name, { onHand, openingStock, sellThrough });
    if (sellThrough !== null) stockedCount += 1;
  }

  // Names that resolved to no product at all are the actionable signal: a
  // custom one-off line, or a naming format this index doesn't know about.
  if (process.env.NODE_ENV !== "production" && unmatched.length > 0) {
    console.warn(
      `[salesVelocity] ${unmatched.length} sold item(s) matched no product — ` +
        `they can't be ranked by sell-through: ${unmatched.join(", ")}`,
    );
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
