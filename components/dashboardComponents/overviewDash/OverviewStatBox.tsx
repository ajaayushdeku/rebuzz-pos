"use client";

import { ICON_MAP } from "@/lib/config/dashboard";
import { getPercentColor } from "@/lib/utils";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  "text-blue-500": "bg-blue-50",
  "text-purple-500": "bg-purple-50",
  "text-red-500": "bg-red-50",
  "text-green-500": "bg-green-50",
  "text-amber-500": "bg-amber-50",
  "text-pink-500": "bg-pink-50",
  "text-cyan-500": "bg-cyan-50",
};

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
  const { text, ArrowIcon } = getPercentColor(percent);
  const { currency } = useCurrency();

  const Icon = ICON_MAP[iconName];
  const iconBg = ICON_BG_MAP[iconColor] ?? "bg-gray-50";

  const formattedValue =
    format === "currency"
      ? formatCurrencySymbol(value, currency.symbol, currency.locale)
      : format === "percent"
        ? `${value}%`
        : value.toLocaleString();

  if (isLoading) {
    return (
      <div className="bg-surface-card rounded-xl border border-surface-border shadow-sm p-3 sm:p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-20 sm:w-24 bg-gray-200 rounded" />
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-6 sm:h-7 w-24 sm:w-28 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-16 sm:w-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border shadow-sm px-4 sm:px-5 md:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 hover:shadow-md transition-shadow duration-200">
      {/* Label + Icon */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-[12px] font-medium text-gray-500 truncate mr-2">
          {label}
        </span>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon size={14} className={`${iconColor} sm:size-[16px]`} />
        </div>
      </div>

      {/* Value */}
      <p className="text-xl sm:text-[20px] md:text-[22px] font-bold text-gray-900 tracking-tight mb-1 sm:mb-1.5">
        {formattedValue}
      </p>

      {/* Percent + period — collapsible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          <ArrowIcon size={12} className={`${text} shrink-0`} />
          <span
            className={`text-[11px] sm:text-xs font-semibold ${text} whitespace-nowrap`}
          >
            {percent > 0 ? "+" : ""}
            {percent}%
          </span>
          {!isExpanded && (
            <span className="text-[10px] sm:text-xs text-gray-400 truncate">
              {periodLabel}
            </span>
          )}
        </div>

        {/* Expand toggle */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
        <div className="mt-2 pt-2 border-t border-gray-50 space-y-0.5">
          {currentDateRange && (
            <p className="text-[10px] sm:text-[11px] text-gray-400">
              <span className="text-gray-500 font-medium">Period: </span>
              {currentDateRange}
            </p>
          )}
          {comparisonDateRangeLabel && (
            <p className="text-[10px] sm:text-[11px] text-gray-400">
              <span className="text-gray-500 font-medium">vs: </span>
              {comparisonDateRangeLabel}
            </p>
          )}
          <p className="text-[10px] sm:text-[11px] text-gray-400">
            {periodLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewStatBox;
