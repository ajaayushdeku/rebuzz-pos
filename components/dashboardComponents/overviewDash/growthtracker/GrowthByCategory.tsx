"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Minus,
  TrendingUp,
} from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatNumber } from "@/utils/helper";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import { ChartCard } from "@/components/dashboardComponents/chartCard";

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
    <ChartCard
      icon={TrendingUp}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / 50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Growth by Category"
      info={{
        heading: "Reading this card",
        // Bar length is size, the badge is direction.
        body: "Each category's revenue over the last 30 days, compared with the 30 days before. The bar is the category's size against the biggest one, so the lengths are comparable; the badge beside it is the change. New means it sold nothing last period.",
      }}
      subtitle="Revenue growth per product category"
      controls={
        // The comparison the whole panel rests on. It was only in the code
        // before, so every percentage on screen was against an unstated
        // baseline.
        <span className="shrink-0 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[11px] text-[#3c4043]">
          Last 30 days vs previous 30
        </span>
      }
      className="flex flex-col gap-6"
    >
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
        <div className="flex items-center justify-center py-10 text-sm text-[#9aa0a6]">
          Failed to load category growth
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No category found</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
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
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : negative
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]";
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
                    <span className="truncate text-[13px] font-medium text-[#3c4043]">
                      {row.name}
                    </span>
                    <div
                      className={`flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide tabular-nums ${badgeStyle}`}
                    >
                      <TrendIcon size={12} />
                      <span>{badgeLabel}</span>
                    </div>
                  </div>

                  {/* Size, and the revenue it stands for. The figure was
                      computed but never rendered before, which left a bar with
                      no number to anchor it. */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f4]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[12px] font-semibold tracking-wide tabular-nums text-[#3c4043]">
                      {fmt(row.current)}
                    </span>
                  </div>

                  {/* What it is being compared against — a percentage with no
                      baseline on screen is a number nobody can check. */}
                  <p className="mt-1 text-[11px] tracking-wide tabular-nums text-[#9aa0a6]">
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
              className="mx-auto mt-5 flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
            >
              <ChevronDown size={12} />
              Show {rows.length - loadMoreCategory} more
            </button>
          ) : (
            <button
              onClick={() => setLoadMoreCategory(4)}
              // Negative colour, as the employee grid's Hide uses.
              className="mx-auto mt-5 flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] text-rose-700 transition-colors hover:bg-rose-100"
            >
              <ChevronUp size={12} />
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
    </ChartCard>
  );
}
