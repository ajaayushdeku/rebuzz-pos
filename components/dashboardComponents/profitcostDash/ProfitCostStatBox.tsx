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
    <div className="border w-full px-3 py-4 md:px-6 md:py-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-end ">
        <p className="text-gray-500 text-xs md:text-sm leading-tight">
          {label}
        </p>

        <Icon
          size={16}
          className={`${iconColor} mb-1 ${bgColor} rounded-lg shrink-0`}
        />
      </div>
      <div className="py-2 md:py-4 mt-1 md:mt-2">
        <span className="font-bold text-lg md:text-2xl">
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
}
