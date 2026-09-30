"use client";

import { LucideIcon } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

interface OrderHistoryStatBoxProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  valueColor?: string;
  format?: "currency" | "number";
  subText?: string;
  isLoading?: boolean;
}

const OrderHistoryStatBox = ({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  valueColor = "text-gray-900 dark:text-[#e8ecf4]",
  format = "number",
  subText,
  isLoading = false,
}: OrderHistoryStatBoxProps) => {
  const { currency } = useCurrency();

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl border border-[#e3e3e3] p-4 animate-pulse dark:bg-[#161d2e] dark:border-white/10"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-24 bg-gray-200 rounded dark:bg-white/10" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg dark:bg-white/10" />
        </div>
        <div className="h-6 w-32 bg-gray-200 rounded dark:bg-white/10" />
        <div className="h-3 w-20 bg-gray-200 rounded mt-2 dark:bg-white/10" />
      </div>
    );
  }

  const displayValue =
    format === "currency"
      ? formatCurrencySymbol(value, currency.symbol, currency.locale)
      : value.toLocaleString();

  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] p-4 dark:bg-[#161d2e] dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="truncate text-[13px] font-medium text-[#5f6368] dark:text-[#a9b4c7]">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${bgColor ?? "bg-gray-50 dark:bg-white/5"} ${iconColor ?? "text-gray-500 dark:text-[#9aa6bd]"} `}
        >
          <Icon size={16} />
        </div>
      </div>
      <p
        className={`truncate text-2xl font-semibold tracking-tight tabular-nums  ${valueColor}`}
      >
        {displayValue}
      </p>
      {subText && (
        <p className="text-[11px] text-gray-500 truncate tracking-wide dark:text-[#9aa6bd]">
          {subText}
        </p>
      )}
    </div>
  );
};

export default OrderHistoryStatBox;
