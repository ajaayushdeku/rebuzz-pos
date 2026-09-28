"use client";

import { ICON_MAP } from "@/lib/config/dashboard";
import { getPercentColor } from "@/lib/utils";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import { ChevronDown, ChevronUp } from "lucide-react";
import RangeTag from "@/components/ui/RangeTag";

interface StatBoxProps {
  label: string;
  value: number;
  percent: number;
  iconName: string;
  iconColor?: string;
  format?: "currency" | "number" | "percent";
  periodLabel?: string;
  comparisonDateRangeLabel?: string;
  currentDateRange?: string;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Map icon color class to a light bg tint
const ICON_BG_MAP: Record<string, string> = {
  "text-blue-500": "bg-blue-50 dark:bg-blue-400/10",
  "text-purple-500": "bg-purple-50 dark:bg-purple-400/10",
  "text-red-500": "bg-red-50 dark:bg-red-400/10",
  "text-green-500": "bg-green-50 dark:bg-emerald-400/10",
  "text-amber-500": "bg-amber-50 dark:bg-amber-400/10",
  "text-pink-500": "bg-pink-50 dark:bg-pink-400/10",
  "text-cyan-500": "bg-cyan-50 dark:bg-cyan-400/10",
};

const CARD =
  "bg-surface-card border-surface-border rounded-xl border border-[#e3e3e3] p-4 md:p-5 dark:border-white/10 dark:bg-[#161d2e]";

const OverviewStatBox = ({
  label,
  value,
  percent,
  iconName,
  iconColor = "text-blue-500",
  format = "number",
  periodLabel = "from last month",
  comparisonDateRangeLabel,
  currentDateRange,
  isLoading = false,
  isExpanded = false,
  onToggle,
}: StatBoxProps) => {
  const { badge, ArrowIcon } = getPercentColor(percent);
  const { currency } = useCurrency();

  const Icon = ICON_MAP[iconName];
  const iconBg = ICON_BG_MAP[iconColor] ?? "bg-gray-50 dark:bg-white/5";

  const formattedValue =
    format === "currency"
      ? formatCurrencySymbol(value, currency.symbol, currency.locale)
      : format === "percent"
        ? `${value}%`
        : value.toLocaleString();

  if (isLoading) {
    return (
      <div className={`${CARD} animate-pulse`}>
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-white/15" />
          <div className="h-7 w-7 shrink-0 rounded-lg bg-gray-200 md:h-8 md:w-8 dark:bg-white/15" />
        </div>
        <div className="mt-3 h-6 w-28 rounded bg-gray-200 md:mt-4 dark:bg-white/15" />
        <div className="mt-2.5 flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-white/10">
          <div className="h-5 w-16 shrink-0 rounded-full bg-gray-200 dark:bg-white/15" />
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${CARD} transition-shadow font-sans duration-200 hover:shadow-md`}
    >
      {/* Label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-[#5f6368] dark:text-[#9aa6bd]">
          {label}
        </span>
        {/* The tile carries the icon's colour, so `border-current/20` frames
            it in the same hue — the idiom the other stat tiles use. */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20 md:h-8 md:w-8 ${iconBg} ${iconColor}`}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 flex items-baseline justify-between gap-2 md:mt-4">
        <p className="truncate font-sans text-xl font-semibold tracking-tight text-[#3c4043] tabular-nums md:text-[22px] dark:text-[#e8ecf4]">
          {formattedValue}
        </p>
        <RangeTag />
      </div>

      {/* Change vs. the comparison period — ruled off so the figure above
          reads on its own, matching the growth tracker tiles. */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums md:text-xs ${badge}`}
          >
            <ArrowIcon size={12} />
            {percent > 0 ? "+" : ""}
            {formatAmount(percent, currency.locale)}%
          </span>
          {!isExpanded && periodLabel && (
            <span className="truncate text-[11px] text-gray-400 md:text-xs dark:text-[#7b869b]">
              {periodLabel}
            </span>
          )}
        </div>

        {/* Expand toggle */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#6b7588] dark:hover:bg-white/10 dark:hover:text-[#c3ccdc]"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Expanded date range detail — with smooth animation */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? "120px" : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="mt-2.5 space-y-1 flex flex-col  rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-white/5">
          {currentDateRange && (
            <p className="flex flex-col items-baseline justify-between gap-1 text-[11px] text-gray-500 dark:text-[#a9b4c7]">
              <span className="shrink-0 font-medium text-gray-400 dark:text-[#7b869b]">
                Period (current)
              </span>
              <span className="truncate text-right tabular-nums">
                {currentDateRange}
              </span>
            </p>
          )}

          <span className="shrink-0 font-medium text-[12px] text-gray-400 dark:text-[#7b869b]">
            vs
          </span>

          {comparisonDateRangeLabel && (
            <p className="flex flex-col items-baseline justify-between gap-1 text-[11px] text-gray-500 dark:text-[#a9b4c7]">
              <span className="truncate text-right tabular-nums">
                {comparisonDateRangeLabel}
              </span>
              {periodLabel && (
                <p className="text-[11px] text-gray-400 dark:text-[#7b869b]">
                  {periodLabel}
                </p>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewStatBox;
