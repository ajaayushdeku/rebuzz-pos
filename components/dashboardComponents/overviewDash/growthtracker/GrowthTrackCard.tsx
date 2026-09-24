"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { CHART_PALETTE } from "../../chartCard";

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
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  bad: {
    icon: "bg-red-50 text-red-600",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
};

/** The month chip worn by both the current and previous figures. */
const MONTH_CHIP =
  "shrink-0 rounded-md bg-[#f1f3f4] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5f6368]";

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
    <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white p-4 md:p-5">
      {/* Label + trend icon */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="truncate text-[13px] font-medium"
          style={{ color: CHART_PALETTE.axis }}
        >
          {label}
        </p>
        {/* The tile carries the icon's colour, so `border-current/20` frames
            it in the same hue — the idiom the other stat tiles use. */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20 md:h-8 md:w-8 ${tone.icon}`}
        >
          <TrendIcon size={15} />
        </div>
      </div>

      {/* Current month */}
      <div className="mt-3 flex items-baseline gap-1.5 md:mt-4">
        <p className="truncate text-xl font-semibold tracking-tight text-[#3c4043] tabular-nums md:text-[22px]">
          {formatValue(value)}
        </p>
        {currentLabel && <span className={MONTH_CHIP}>{currentLabel}</span>}
      </div>

      {/* Previous month — separated so the two periods don't read as one line */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#e8eaed] pt-2.5">
        {/* The month reads as a ghost of the chip above, so the two periods
            pair up visually; without a month it falls back to the plain word. */}
        <p className="flex min-w-0 items-baseline gap-1.5 text-[11px] text-[#9aa0a6] md:text-xs">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#9aa0a6]">
            prev:
          </span>
          <span className="truncate tracking-wide tabular-nums">
            {formatValue(prev)}{" "}
            {previousLabel && (
              <span className={`ml-1 ${MONTH_CHIP}`}>{previousLabel}</span>
            )}
          </span>
        </p>

        <div
          className={`flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums md:text-xs ${tone.badge}`}
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
