"use client";
import { ICON_MAP } from "@/lib/config/dashboard";
import { useCurrency } from "@/providers/CurrencyContext";

export interface StatBoxProps {
  key: string;
  label: string;
  value: number;
  iconName: string;
  iconColor?: string;
  bgColor?: string;
  format?: "currency" | "number" | "percent";
}
export default function StatBox({
  label,
  value,
  iconName,
  iconColor,
  bgColor,
  format = "number",
}: StatBoxProps) {
  const { currency } = useCurrency();
  const formatValue = (value: number) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.code,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (format === "percent") {
      return `${value}%`;
    }
    return value.toLocaleString();
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
