"use client";

import { useState } from "react";
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
  currentDateRange?: string;
  isLoading?: boolean;
}

const OverviewStatBox = ({
  label,
  value,
  percent,
  iconName,
  iconColor,
  periodLabel = "from previous month",
  currentDateRange,
  isLoading = false,
}: StatBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { text, ArrowIcon } = getPercentColor(percent);
  const { currency } = useCurrency();

  const Icon = ICON_MAP[iconName];

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-6 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div
          className={`w-7 h-7 rounded-lg ${iconColor?.includes("bg-") ? iconColor : "bg-gray-50"} flex items-center justify-center shrink-0`}
        >
          <Icon
            size={16}
            className={iconColor?.replace("bg-", "text-") || "text-gray-500"}
          />
        </div>
      </div>

      {/* Value with inline percent badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold text-gray-900 truncate">
          {label === "Total Orders" || label === "Products Sold"
            ? value
            : formatCurrencySymbol(value, currency.symbol, currency.locale)}

          {isExpanded && currentDateRange && (
            <span className=" pl-1.5 text-gray-400 font-semibold text-[10px]">
              {currentDateRange}
            </span>
          )}
        </p>
        <span className="flex flex-row item-center gap-1">
          {" "}
          <span className={`text-xs font-bold ${text} shrink-0`}>
            {percent}%
          </span>
          <ArrowIcon size={14} className={`${text} shrink-0`} />
        </span>
      </div>

      {/* Expandable section with chevron on right */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mt-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        {isExpanded ? (
          <div className="flex flex-col items-start gap-2">
            <span className="flex flex-row items-center gap-1">
              <span className={`text-[10px] font-bold ${text} shrink-0`}>
                {percent}%
              </span>
              <ArrowIcon size={14} className={`${text} shrink-0`} />
              <span className="truncate">{periodLabel}</span>
            </span>
          </div>
        ) : (
          <span className="truncate"></span>
        )}
        {isExpanded ? (
          <ChevronUp size={12} className="shrink-0" />
        ) : (
          <ChevronDown size={12} className="shrink-0" />
        )}
      </button>
    </div>
  );
};

export default OverviewStatBox;
