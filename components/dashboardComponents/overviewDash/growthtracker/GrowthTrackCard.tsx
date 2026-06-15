"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface GrowthTrackCardProps {
  label: string;
  value: number;
  prev: number;
  percent: number;
  inverseColor?: boolean;
  format?: "currency" | "number" | "percent";
}

function isGood(percent: number, inverseColor: boolean) {
  const positive = percent >= 0;
  return inverseColor ? !positive : positive;
}

export default function GrowthTrackCard({
  label,
  value,
  prev,
  percent,
  inverseColor = false,
  format = "number",
}: GrowthTrackCardProps) {
  const good = isGood(percent, inverseColor);
  const cardBg = good ? "bg-emerald-50" : "bg-red-50";
  const iconBg = good ? "bg-green-100" : "bg-red-100";
  const iconColor = good ? "text-green-700" : "text-red-700";
  const badgeBg = good ? "bg-green-100" : "bg-red-100";
  const badgeColor = good ? "text-green-700" : "text-red-700";
  const TrendIcon = good ? TrendingUp : TrendingDown;
  const ArrowIcon = good ? ArrowUpRight : ArrowDownRight;

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

  return (
    <div
      className={`p-4 md:p-6 w-full border rounded-2xl transition duration-300 shadow-sm hover:shadow-md border-gray-100 ${cardBg}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm md:text-base font-medium text-gray-500">
          {label}
        </p>

        <div
          className={`w-8 h-8 flex items-center justify-center rounded-lg ${iconBg} shrink-0`}
        >
          <TrendIcon size={16} className={iconColor} />
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <p className="font-bold text-xl md:text-2xl text-gray-900">
          {formatValue(value)}
        </p>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs md:text-sm text-gray-400">
            prev: {formatValue(prev)}
          </p>

          <div
            className={`flex items-center gap-0.5 ${badgeBg} ${badgeColor} rounded-full px-2 py-0.5 text-xs font-semibold`}
          >
            <ArrowIcon size={12} />
            <span>
              {percent > 0 ? "+" : ""}
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
