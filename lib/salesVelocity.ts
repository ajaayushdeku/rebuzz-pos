import { MergedSalesItem } from "@/services/apiInventory";

export type Velocity = "fast" | "normal" | "slow";

export interface VelocityResult {
  fast: MergedSalesItem[];
  normal: MergedSalesItem[];
  slow: MergedSalesItem[];
  /** Every item keyed by name → its class, for per-item lookups (bar colours). */
  byName: Map<string, Velocity>;
  /** Items ranked by units sold, descending. Sorted here, not trusted from the API. */
  ranked: MergedSalesItem[];
  totalUnits: number;
  medianUnits: number;
}

/**
 * Share of total units that counts as "fast": items are ranked by quantity
 * sold and taken until they cover this much of everything sold. Standard ABC
 * inventory analysis uses 80%.
 */
const FAST_CUMULATIVE_SHARE = 0.8;

/** Items sitting in the final 5% of cumulative units are the slow tail. */
const SLOW_CUMULATIVE_SHARE = 0.95;

const median = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Classifies products by share of total units sold, not by ratio to the single
 * top seller.
 *
 * Ranking against the top seller breaks on skewed catalogues: one runaway
 * product pushes the threshold so high that genuinely strong sellers fall
 * below it — with real data, a product selling 116 units was classed slow
 * because the bestseller sold 390. Cumulative share can't do that: it asks
 * "which products account for most of what we actually sell", so the number of
 * fast movers follows the shape of the data.
 *
 *   fast   → within the first 80% of cumulative units AND above the median
 *   slow   → within the last 5% of cumulative units AND at or below the median
 *   normal → everything between
 *
 * The median guards stop a lopsided catalogue from mislabelling: a product can
 * never be "slow" while outselling half the range, and when every product
 * sells about the same, nothing is flagged either way.
 *
 * This is the single source of truth for velocity across the inventory
 * dashboard, so the panels, the movement analysis and the chart colours can't
 * drift apart.
 */
export function classifySalesVelocity(
  items: MergedSalesItem[],
): VelocityResult {
  const byName = new Map<string, Velocity>();

  if (items.length === 0) {
    return {
      fast: [],
      normal: [],
      slow: [],
      byName,
      ranked: [],
      totalUnits: 0,
      medianUnits: 0,
    };
  }

  // Sort locally — never rely on the order the API happened to return.
  const ranked = [...items].sort((a, b) => b.count - a.count);
  const totalUnits = ranked.reduce((sum, i) => sum + i.count, 0);

  // Nothing sold in this range — every product is slow by definition.
  if (totalUnits <= 0) {
    for (const item of ranked) byName.set(item.name, "slow");
    return {
      fast: [],
      normal: [],
      slow: ranked,
      byName,
      ranked,
      totalUnits: 0,
      medianUnits: 0,
    };
  }

  const medianUnits = median(ranked.map((i) => i.count));

  const fast: MergedSalesItem[] = [];
  const normal: MergedSalesItem[] = [];
  const slow: MergedSalesItem[] = [];
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

  return { fast, normal, slow, byName, ranked, totalUnits, medianUnits };
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
