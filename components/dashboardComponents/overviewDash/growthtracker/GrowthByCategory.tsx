"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";

/** Format a Date as YYYY-MM-DD (local). */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type CategoryRow = {
  name: string;
  current: number;
  previous: number;
  /** Percentage change; null when there is no previous-period data. */
  growth: number | null;
};

export default function GrowthByCategory() {
  const { currency } = useCurrency();

  const [loadMoreCategory, setLoadMoreCategory] = useState(4);

  // Current period: last 30 days (including today).
  // Previous period: the 30 days immediately preceding it.
  const { current, previous } = useMemo(() => {
    const today = new Date();
    const currEnd = new Date(today);
    const currStart = new Date(today);
    currStart.setDate(today.getDate() - 29);

    const prevEnd = new Date(today);
    prevEnd.setDate(today.getDate() - 30);
    const prevStart = new Date(today);
    prevStart.setDate(today.getDate() - 59);

    return {
      current: { start: toDateStr(currStart), end: toDateStr(currEnd) },
      previous: { start: toDateStr(prevStart), end: toDateStr(prevEnd) },
    };
  }, []);

  const currentQuery = useSalesByCategory(current.start, current.end);
  const previousQuery = useSalesByCategory(previous.start, previous.end);

  const isLoading = currentQuery.isLoading || previousQuery.isLoading;
  const isError = currentQuery.isError || previousQuery.isError;

  const rows = useMemo<CategoryRow[]>(() => {
    const currData = currentQuery.data ?? [];
    const prevData = previousQuery.data ?? [];

    const currMap = new Map<string, number>();
    for (const c of currData) {
      currMap.set(c.name, (currMap.get(c.name) ?? 0) + c.totalRevenue);
    }
    const prevMap = new Map<string, number>();
    for (const p of prevData) {
      prevMap.set(p.name, (prevMap.get(p.name) ?? 0) + p.totalRevenue);
    }

    const names = new Set<string>([...currMap.keys(), ...prevMap.keys()]);

    const result: CategoryRow[] = Array.from(names).map((name) => {
      const currentRevenue = currMap.get(name) ?? 0;
      const previousRevenue = prevMap.get(name) ?? 0;
      const growth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : null;
      return {
        name,
        current: currentRevenue,
        previous: previousRevenue,
        growth,
      };
    });

    // Highest positive growth first, largest declines at the bottom.
    // Categories without previous data (growth === null) are treated as neutral.
    return result.sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0));
  }, [currentQuery.data, previousQuery.data]);

  // Returns the base bar fill percentage (capped at 100%) based on current vs previous revenue.
  // When previous is 0, uses 100% to represent "new" revenue.
  const baseBarPercent = (current: number, previous: number): number => {
    if (previous > 0) {
      return Math.min(100, (current / previous) * 100);
    }
    return current > 0 ? 100 : 0;
  };

  // Returns the overfill percentage (excess current revenue beyond previous).
  // Only non-zero when current > previous and previous > 0.
  const overfillPercent = (current: number, previous: number): number => {
    if (previous > 0 && current > previous) {
      return ((current - previous) / previous) * 100;
    }
    return 0;
  };

  const fmt = (value: number) =>
    formatCurrencySymbol(value, currency.symbol, currency.locale);

  // Track newly revealed items for slide-down animation
  const [animatingIndexes, setAnimatingIndexes] = useState<Set<number>>(
    new Set(),
  );

  const handleLoadMore = () => {
    const prev = loadMoreCategory;
    const next = prev + 2;
    setLoadMoreCategory(next);
    // Mark newly visible indexes for animation
    const newSet = new Set<number>();
    for (let i = prev; i < next && i < rows.length; i++) {
      newSet.add(i);
    }
    setAnimatingIndexes(newSet);
    // Clear animation flags after animation completes
    setTimeout(() => setAnimatingIndexes(new Set()), 500);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm mt-2 md:mt-4 p-6 w-full">
      <div className="mb-4 md:mb-5">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Growth by Category
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Month-over-month revenue growth per product category
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-14 bg-gray-200 rounded" />
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
          Failed to load category growth
        </div>
      ) : rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
          No sales data available
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {rows.slice(0, loadMoreCategory).map((row) => {
              const positive = row.growth !== null && row.growth > 0;
              const negative = row.growth !== null && row.growth < 0;

              const barColor = positive
                ? "bg-emerald-500"
                : negative
                  ? "bg-red-500"
                  : "bg-gray-300";
              const badgeStyle = positive
                ? "bg-emerald-50 text-emerald-700"
                : negative
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-500";
              const TrendIcon = positive
                ? ArrowUpRight
                : negative
                  ? ArrowDownRight
                  : Minus;

              const badgeLabel =
                row.growth === null
                  ? row.current > 0
                    ? "New"
                    : "—"
                  : `${row.growth > 0 ? "+" : ""}${row.growth.toFixed(1)}%`;

              const index = rows.indexOf(row);
              const isNew = animatingIndexes.has(index);

              return (
                <div
                  key={row.name}
                  className={`space-y-1.5 ${isNew ? "animate-slideDown" : ""}`}
                >
                  {/* Top row: name + growth badge */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {row.name}
                    </span>
                    <div
                      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${badgeStyle}`}
                    >
                      <TrendIcon size={12} />
                      <span>{badgeLabel}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    {/* Base bar: current revenue relative to previous */}
                    <div
                      className={`absolute top-0 left-0 h-2.5 rounded-full transition-all duration-700 ${barColor}`}
                      style={{
                        width: `${baseBarPercent(row.current, row.previous)}%`,
                      }}
                    />
                    {/* Overfill bar: excess when current > previous */}
                    {overfillPercent(row.current, row.previous) > 0 && (
                      <div
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-700 bg-blue-500`}
                        style={{
                          width: `${overfillPercent(row.current, row.previous)}%`,
                          left: `${baseBarPercent(row.current, row.previous)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {loadMoreCategory < rows.length ? (
            <button
              onClick={handleLoadMore}
              className="mt-3 mx-auto flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 hover:border-gray-300 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Load More ({rows.length - loadMoreCategory})
            </button>
          ) : (
            <button
              onClick={() => setLoadMoreCategory(4)}
              className="mt-3 mx-auto flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 border border-gray-200 hover:border-gray-300 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
              Hide
            </button>
          )}
        </>
      )}

      {/* Inject the slide-down keyframes */}
      <style jsx>{`
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-8px) scaleY(0.95);
            max-height: 0;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 80px;
          }
        }
        :global(.animate-slideDown) {
          animation: slideDown 0.35s ease-out forwards;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
