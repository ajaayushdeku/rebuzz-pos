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
  valueColor = "text-gray-900",
  format = "number",
  subText,
  isLoading = false,
}: OrderHistoryStatBoxProps) => {
  const { currency } = useCurrency();

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
        <div className="h-3 w-20 bg-gray-200 rounded mt-2" />
      </div>
    );
  }

  const displayValue =
    format === "currency"
      ? formatCurrencySymbol(value, currency.symbol, currency.locale)
      : value.toLocaleString();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div
          className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}
        >
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <p className={`text-lg font-bold truncate ${valueColor}`}>
        {displayValue}
      </p>
      {subText && (
        <p className="text-[11px] text-gray-400 truncate">{subText}</p>
      )}
    </div>
  );
};

export default OrderHistoryStatBox;
