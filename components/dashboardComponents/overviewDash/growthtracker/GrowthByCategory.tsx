"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatNumber } from "@/utils/helper";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import { ComponentHeader } from "@/components/ComponentHeader";

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

  /**
   * The biggest category this period, which every bar is drawn against.
   *
   * The bars used to encode current-over-previous, so a category that doubled
   * from Rs 200 and one that doubled from Rs 2,000,000 drew the same bar, and
   * anything past +100% was clipped by the track it overflowed. Scaling to the
   * largest category instead makes the bars comparable down the column: length
   * is size, and the badge beside it is direction. Two facts, one each.
   */
  const maxCurrent = useMemo(
    () => rows.reduce((max, r) => Math.max(max, r.current), 0),
    [rows],
  );

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
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp size={16} />
        </div>
        <ComponentHeader
          title="Growth by Category"
          subHeader="Revenue growth per product category"
        />

        {/* The comparison the whole panel rests on. It was only in the code
            before, so every percentage on screen was against an unstated
            baseline. */}
        <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
          Last 30 days vs previous 30
        </span>
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
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">No category found</p>
          <p className="text-xs text-gray-400 mt-1">
            Category growth data will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {rows.slice(0, loadMoreCategory).map((row, index) => {
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
                  : `${row.growth > 0 ? "+" : ""}${formatNumber(row.growth)}%`;

              const isNew = animatingIndexes.has(index);
              const share =
                maxCurrent > 0 ? (row.current / maxCurrent) * 100 : 0;

              return (
                <div
                  key={row.name}
                  className={isNew ? "animate-slideDown" : undefined}
                >
                  {/* Name and direction */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-gray-800">
                      {row.name}
                    </span>
                    <div
                      className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide tabular-nums ${badgeStyle}`}
                    >
                      <TrendIcon size={12} />
                      <span>{badgeLabel}</span>
                    </div>
                  </div>

                  {/* Size, and the revenue it stands for. The figure was
                      computed but never rendered before, which left a bar with
                      no number to anchor it. */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[12px] font-semibold tabular-nums text-gray-800 tracking-wide">
                      {fmt(row.current)}
                    </span>
                  </div>

                  {/* What it is being compared against — a percentage with no
                      baseline on screen is a number nobody can check. */}
                  <p className="mt-1 text-[11px] tabular-nums tracking-wide text-gray-400">
                    {row.previous > 0
                      ? `from ${fmt(row.previous)} last period`
                      : "nothing sold last period"}
                  </p>
                </div>
              );
            })}
          </div>
          {loadMoreCategory < rows.length ? (
            <button
              onClick={handleLoadMore}
              className="mt-5 mx-auto flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500  hover:bg-gray-100 hover:text-gray-700 border border-gray-200 hover:border-gray-300 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
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
              className="mt-5 mx-auto flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 bg-white-50 hover:bg-gray-100 hover:text-gray-600 border border-gray-200 hover:border-gray-300 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
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
