"use client";
import { ICON_MAP } from "@/lib/config/dashboard";
import { useCurrency } from "@/providers/CurrencyContext";
import { StatBoxProps } from "../StatBox";
import { formatCurrencySymbol } from "@/utils/helper";

export default function StatBox({
  label,
  value,
  iconName,
  iconColor,
  bgColor,
  format = "number",
}: StatBoxProps) {
  const { currency } = useCurrency();

  const formatValue = (val: number) => {
    if (format === "currency") {
      return formatCurrencySymbol(val, currency.symbol, currency.locale);
    }
    if (format === "percent") {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const Icon = ICON_MAP[iconName];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div
          className={`w-7 h-7 rounded-lg ${bgColor ?? "bg-gray-50"} flex items-center justify-center shrink-0`}
        >
          <Icon size={16} className={iconColor ?? "text-gray-500"} />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900 truncate">
        {formatValue(value)}
      </p>
    </div>
  );
}
