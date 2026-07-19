"use client";

import { useState } from "react";
import { Flame, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { MergedSalesItem } from "@/services/apiInventory";
import { ComponentHeader } from "@/components/ComponentHeader";

type MovingItem = {
  name: string;
  category: string;
  sold: number;
  changePct: number;
  changeDir: "up" | "down";
};

const INITIAL_SHOW = 3;

/** Per-item profit margin over cost (%), used as the change indicator. */
const marginPct = (item: MergedSalesItem): number => {
  const cost = item.totalRevenue - item.netProfit;
  if (cost <= 0) return 0;
  return Math.round((item.netProfit / cost) * 100);
};

// Same classification approach as InventoryMovementAnalysis: rank by units sold
// relative to the top seller (items arrive already sorted desc by count).
const classify = (
  items: MergedSalesItem[],
): {
  fast: MovingItem[];
  slow: MovingItem[];
} => {
  if (items.length === 0) return { fast: [], slow: [] };

  const max = items[0].count || 1;
  const fast: MovingItem[] = [];
  const slow: MovingItem[] = [];

  for (const item of items) {
    const ratio = item.count / max;
    const row: MovingItem = {
      name: item.name,
      category: item.category,
      sold: item.count,
      changePct: Math.abs(marginPct(item)),
      changeDir: "up",
    };
    if (ratio >= 0.6) {
      fast.push(row);
    } else if (ratio < 0.25) {
      slow.push({ ...row, changeDir: "down" });
    }
  }

  return {
    fast: fast,
    slow: slow.reverse(),
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
  const pctColor = isFast ? "text-green-500" : "text-red-500";
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
          <p className="text-sm font-bold text-gray-900">{item.sold} sold</p>
          <p className={`text-[11px] font-semibold ${pctColor}`}>
            {item.changeDir === "up" ? "+" : "-"}
            {item.changePct}%
          </p>
        </div>
        {item.changeDir === "up" ? (
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
}: {
  type: "fast" | "slow";
  items: MovingItem[];
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
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No {isFast ? "fast" : "slow"} moving items
          </p>
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

const FastSlowMovingItems = ({ items }: { items: MergedSalesItem[] }) => {
  const { fast, slow } = classify(items);

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
      <Panel type="fast" items={fast} />
      <Panel type="slow" items={slow} />
    </div>
  );
};

export default FastSlowMovingItems;
