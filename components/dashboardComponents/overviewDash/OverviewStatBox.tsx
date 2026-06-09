"use client";

import { ICON_MAP } from "@/lib/config/dashboard";
import { getPercentColor } from "@/lib/utils";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

interface StatBoxProps {
  label: string;
  value: number;
  percent: number;
  iconName: string;
  iconColor?: string;
  format?: "currency" | "number" | "percent";
  periodLabel?: string;
  isLoading?: boolean;
}

const OverviewStatBox = ({
  label,
  value,
  percent,
  iconName,
  iconColor,
  periodLabel = "from previous month",
  isLoading = false,
}: StatBoxProps) => {
  const { text, ArrowIcon } = getPercentColor(percent);
  const { currency } = useCurrency();

  const Icon = ICON_MAP[iconName];

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 animate-pulse"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex justify-between items-end">
          <div className="h-3 md:h-4 w-24 bg-gray-200 rounded" />
          <div className="w-4 h-4 bg-gray-200 rounded mb-1" />
        </div>

        <div className="py-4 space-y-3">
          <div className="h-6 md:h-7 w-32 bg-gray-200 rounded" />

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-3 w-8 bg-gray-200 rounded" />
            <div className="h-3 w-28 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm md:text-base font-medium leading-tight">
          {label}
        </p>

        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 shrink-0">
          <Icon size={16} className={`${iconColor || "text-gray-500"}`} />
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <span className="font-bold text-xl md:text-2xl text-gray-900">
          {label === "Total Orders" || label === "Products Sold"
            ? value
            : formatCurrency(value, currency)}
        </span>

        <div className="flex items-center gap-1 mt-1.5">
          <ArrowIcon size={14} className={`${text} shrink-0`} />
          <span className={`text-xs md:text-sm font-medium ${text}`}>
            {percent}%
          </span>
          <span className="text-gray-400 text-xs md:text-sm ml-0.5">
            {periodLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverviewStatBox;
