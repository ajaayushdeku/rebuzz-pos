"use client";

import { LucideIcon } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE } from "../chartCard";

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
        <span
          className="truncate text-[13px] font-medium"
          style={{ color: CHART_PALETTE.axis }}
        >
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${bgColor ?? "bg-gray-50"} ${iconColor ?? "text-gray-500"} `}
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
        <p className="text-[11px] text-gray-500 truncate tracking-wide">
          {subText}
        </p>
      )}
    </div>
  );
};

export default OrderHistoryStatBox;
