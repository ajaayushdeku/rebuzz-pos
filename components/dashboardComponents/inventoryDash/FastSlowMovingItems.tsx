"use client";

import { useState } from "react";
import { Flame, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";
import { ComponentHeader } from "@/components/ComponentHeader";
import { classifySalesVelocity, type VelocityBasis } from "@/lib/salesVelocity";

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

  console.log("Metrics:", metrics);

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
  const barColor = isFast ? "bg-green-500" : "bg-amber-400";
  const arrowColor = isFast ? "text-green-400" : "text-amber-500";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border ${
        isFast
          ? "border-green-100 bg-green-50/30"
          : "border-amber-100 bg-amber-50/30"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-1 h-9 rounded-full shrink-0 ${barColor}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {item.name}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{item.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">
            {item.sold.toLocaleString()} sold
          </p>
          {item.sellThrough !== null && (
            <p className="text-[11px] text-gray-400">
              {(item.sellThrough * 100).toFixed(2)}% of{" "}
              {item.openingStock?.toLocaleString()} stock
            </p>
          )}
        </div>
        {isFast ? (
          <svg
            className={`w-4 h-4 ${arrowColor}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20V4" />
            <path d="M5 11l7-7 7 7" />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 ${arrowColor}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4v16" />
            <path d="M19 13l-7 7-7-7" />
          </svg>
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

  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 ${
        isFast ? "border-green-200" : "border-amber-200"
      }`}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="flex items-center gap-2 mb-0.5">
          {isFast ? (
            <Flame size={18} className="text-green-600" />
          ) : (
            <TrendingDown size={18} className="text-amber-500" />
          )}
        </div>

        <ComponentHeader
          title={`${isFast ? "Fast Moving Items" : "Slow Moving Items"}`}
          subHeader={`${
            isFast
              ? "Your bestsellers — keep stocked and consider expanding"
              : "These need attention — consider a promo or recipe change"
          }`}
          titleColor={`${isFast ? "text-green-700" : "text-amber-600"}`}
        />
      </div>

      {/* <p className="text-[11px] text-gray-400 -mt-2">
        {basis === "sell-through"
          ? "Ranked by sell-through — units sold ÷ opening stock"
          : "Ranked by share of total units sold"}
      </p> */}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              {isFast ? (
                <Flame size={24} className="text-gray-500" />
              ) : (
                <TrendingDown size={24} className="text-gray-500" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-500">
              {" "}
              No {isFast ? "fast" : "slow"} moving items
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isFast ? "Fast" : "Slow"} moving items data will appear here
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <ItemRow key={item.name} item={item} type={type} />
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp size={14} className="rotate-[-90deg]" /> Prev
          </button>
          <span className="text-xs text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronDown size={14} className="rotate-[-90deg]" />
          </button>
        </div>
      )}
    </div>
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

  console.log("Sales:", items);

  console.log("Fast:", fast);
  console.log("Slow:", slow);
  console.log("Basis:", basis);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
      <Panel type="fast" items={fast} basis={basis} />
      <Panel type="slow" items={slow} basis={basis} />
    </div>
  );
};

export default FastSlowMovingItems;
