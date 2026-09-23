"use client";

import { useState } from "react";
import { Flame, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";
import { classifySalesVelocity, type VelocityBasis } from "@/lib/salesVelocity";
import { CHART_PALETTE, ChartCard, ChartPager } from "../chartCard";

type MovingItem = {
  name: string;
  category: string;
  sold: number;
  /** sold ÷ opening stock, 0–1, or null when the product isn't stock-tracked */
  sellThrough: number | null;
  openingStock: number | null;
};

const INITIAL_SHOW = 3;

/**
 * Fast and slow come from the shared velocity classifier, so these panels, the
 * movement analysis and the chart colours can't disagree.
 *
 * When inventory is supplied the ranking is by sell-through — sold ÷ (stock on
 * hand + sold) — so a product that shifted 350 units out of an opening 850 is
 * ranked ahead of one that shifted 350 out of 2,350. Without inventory it
 * falls back to share of total units sold.
 */
const classify = (
  sales: MergedSalesItem[],
  inventory?: InventoryItem[],
): {
  fast: MovingItem[];
  slow: MovingItem[];
  basis: VelocityBasis;
} => {
  const { fast, slow, metrics, basis } = classifySalesVelocity(
    sales,
    inventory,
  );

  const toRow = (item: MergedSalesItem): MovingItem => {
    const m = metrics.get(item.name);
    return {
      name: item.name,
      category: item.category,
      sold: item.count,
      sellThrough: m?.sellThrough ?? null,
      openingStock: m?.openingStock ?? null,
    };
  };

  // Only sell-through mode requires a rate — units mode ranked by quantity,
  // so dropping rate-less rows there would empty the panels.
  const rankedByRate = basis === "sell-through";
  const keep = (item: MovingItem) =>
    rankedByRate ? item.sellThrough !== null : true;

  const byRateDesc = (a: MovingItem, b: MovingItem) =>
    (b.sellThrough ?? 0) - (a.sellThrough ?? 0);
  const byRateAsc = (a: MovingItem, b: MovingItem) =>
    (a.sellThrough ?? 0) - (b.sellThrough ?? 0);
  const bySoldDesc = (a: MovingItem, b: MovingItem) => b.sold - a.sold;
  const bySoldAsc = (a: MovingItem, b: MovingItem) => a.sold - b.sold;

  return {
    fast: fast
      .map(toRow)
      .filter(keep)
      .sort(rankedByRate ? byRateDesc : bySoldDesc),
    // Weakest first, so the most urgent slow mover is on the opening page.
    slow: slow
      .map(toRow)
      .filter(keep)
      .sort(rankedByRate ? byRateAsc : bySoldAsc),
    basis,
  };
};

const ItemRow = ({
  item,
  type,
}: {
  item: MovingItem;
  type: "fast" | "slow";
}) => {
  const isFast = type === "fast";
  // The one bit of colour on the row: a rail in the panel's own hue.
  const accent = isFast ? CHART_PALETTE.good : CHART_PALETTE.warn;

  return (
    <div
      className="flex items-center justify-between gap-2 border-b py-3 last:border-0"
      style={{ borderColor: CHART_PALETTE.grid }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="h-9 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="min-w-0">
          <p
            className="truncate text-[13px]"
            style={{ color: CHART_PALETTE.title }}
          >
            {item.name}
          </p>
          <p
            className="truncate text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {item.category}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p
            className="text-[13px] font-medium tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {item.sold.toLocaleString()} sold
          </p>
          {item.sellThrough !== null && (
            <p
              className="text-[11px] tabular-nums"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {(item.sellThrough * 100).toFixed(1)}% of{" "}
              {item.openingStock?.toLocaleString()} stock
            </p>
          )}
        </div>
        {isFast ? (
          <ArrowUp size={15} style={{ color: accent }} />
        ) : (
          <ArrowDown size={15} style={{ color: accent }} />
        )}
      </div>
    </div>
  );
};

const Panel = ({
  type,
  items,
  basis,
}: {
  type: "fast" | "slow";
  items: MovingItem[];
  basis: VelocityBasis;
}) => {
  const isFast = type === "fast";
  const totalPages = Math.ceil(items.length / INITIAL_SHOW);
  const [page, setPage] = useState(0);
  const start = page * INITIAL_SHOW;
  const displayedItems = items.slice(start, start + INITIAL_SHOW);

  // Said once, in the ⓘ: which of the two rankings is in force right now.
  const ranking =
    basis === "sell-through"
      ? "Ranked by sell-through — units sold as a share of the stock that was there to sell."
      : "Ranked by share of total units sold, because stock levels were not available.";

  return (
    <ChartCard
      icon={isFast ? Flame : TrendingDown}
      // Green for the bestsellers, amber for the ones needing attention.
      iconColor={isFast ? "#16a34a" : "#d97706"}
      iconBorder={isFast ? "#bbf7d0" : "#fde68a"}
      iconBg={isFast ? "#f0fdf4" : "#fffbeb"}
      title={isFast ? "Fast Moving Items" : "Slow Moving Items"}
      info={{
        heading: "Reading this card",
        body: `${ranking} Covers the past 30 days. ${
          isFast
            ? "These are your bestsellers — worth keeping stocked."
            : "The weakest mover is shown first, so the most urgent one is on the opening page."
        }`,
      }}
      subtitle={
        isFast
          ? "Your bestsellers over the past 30 days"
          : "These need attention — consider a promo or recipe change"
      }
      controls={
        totalPages > 1 && (
          <ChartPager
            first={start + 1}
            last={Math.min(start + INITIAL_SHOW, items.length)}
            total={items.length}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            itemLabel="items"
          />
        )
      }
      className="h-full"
    >
      <div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: CHART_PALETTE.hover }}
            >
              {isFast ? (
                <Flame size={24} style={{ color: CHART_PALETTE.subtitle }} />
              ) : (
                <TrendingDown
                  size={24}
                  style={{ color: CHART_PALETTE.subtitle }}
                />
              )}
            </div>
            <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
              No {isFast ? "fast" : "slow"} moving items
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {isFast ? "Fast" : "Slow"} moving items data will appear here
            </p>
          </div>
        ) : (
          <div className="border-t" style={{ borderColor: CHART_PALETTE.grid }}>
            {displayedItems.map((item) => (
              <ItemRow key={item.name} item={item} type={type} />
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
};

const FastSlowMovingItems = ({
  items,
  inventory,
}: {
  items: MergedSalesItem[];
  /** Optional. Supplied, ranking switches from units sold to sell-through. */
  inventory?: InventoryItem[];
}) => {
  const { fast, slow, basis } = classify(items, inventory);

  return (
    <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
      <Panel type="fast" items={fast} basis={basis} />
      <Panel type="slow" items={slow} basis={basis} />
    </div>
  );
};

export default FastSlowMovingItems;
