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
  /** Short month name for the value, e.g. "Aug". */
  currentLabel?: string;
  /** Short month name for `prev`, e.g. "Jul". */
  previousLabel?: string;
}

function isGood(percent: number, inverseColor: boolean) {
  const positive = percent >= 0;
  return inverseColor ? !positive : positive;
}

/** Tone accents. The card itself stays white — only the chips carry colour. */
const TONE = {
  good: {
    icon: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  bad: {
    icon: "bg-red-50 text-red-600",
    badge: "bg-red-50 text-red-700 ring-red-100",
  },
};

export default function GrowthTrackCard({
  label,
  value,
  prev,
  percent,
  inverseColor = false,
  format = "number",
  currentLabel,
  previousLabel,
}: GrowthTrackCardProps) {
  const good = isGood(percent, inverseColor);
  const tone = good ? TONE.good : TONE.bad;
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
    <div className="bg-surface-card border-surface-border w-full rounded-xl border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
      {/* Label + trend icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-gray-500 md:text-[13px]">
          {label}
        </p>

        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 ${tone.icon}`}
        >
          <TrendIcon size={15} />
        </div>
      </div>

      {/* Current month */}
      <div className="mt-3 flex items-baseline gap-1.5 md:mt-4">
        <p className="truncate text-xl font-bold tracking-wide text-gray-900 tabular-nums md:text-[22px] ">
          {formatValue(value)}
        </p>
        {currentLabel && (
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {currentLabel}
          </span>
        )}
      </div>

      {/* Previous month — separated so the two periods don't read as one line */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
        {/* The month reads as a ghost of the chip above, so the two periods
            pair up visually; without a month it falls back to the plain word. */}
        <p className="flex min-w-0 items-baseline gap-1.5 text-[11px] text-gray-400 md:text-xs">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            prev:
          </span>
          <span className="truncate  tracking-wide tabular-nums">
            {formatValue(prev)}{" "}
            {previousLabel && (
              <span className="shrink-0 rounded-md bg-gray-100 ml-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {previousLabel}
              </span>
            )}
          </span>
        </p>

        <div
          className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 md:text-xs ${tone.badge}`}
        >
          <ArrowIcon size={12} />
          <span>
            {percent > 0 ? "+" : ""}
            {percent}%
          </span>
        </div>
      </div>
    </div>
  );
}
