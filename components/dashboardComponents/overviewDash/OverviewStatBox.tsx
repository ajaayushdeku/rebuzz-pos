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
  // format = "number",
}: StatBoxProps) => {
  const { text, ArrowIcon } = getPercentColor(percent);
  const { currency } = useCurrency();

  const Icon = ICON_MAP[iconName];

  if (isLoading) {
    return (
      <div
        className="border w-full px-3 md:px-6 py-4 md:py-6 rounded-lg shadow-md animate-pulse bg-white"
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
    <div className="border w-full px-3 md:px-6 py-4 md:py-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-end">
        <p className="text-gray-500 text-sm md:text-base leading-tight">
          {label}
        </p>

        <Icon size={16} className={`${iconColor} mb-1 rounded-lg shrink-0`} />
      </div>

      <div className="py-4">
        <span className="font-bold text-lg md:text-2xl">
          {/* {formatValue(value)} */}
          {label === "Total Orders" || label === "Products Sold"
            ? value
            : formatCurrency(value, currency)}
        </span>

        <div className="flex justify-start gap-0.5">
          <ArrowIcon size={16} className={`${text} mt-1`} />

          <span className={`text-[12px] md:text-base ${text}`}>
            {percent}%{" "}
          </span>

          <span className="text-gray-500 text-[12px] md:text-base">
            {" "}
            {periodLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverviewStatBox;
