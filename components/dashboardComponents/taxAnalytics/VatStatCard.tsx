"use client";

import MiniTrendChart, { VatStat } from "./MiniTrendChart";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { CHART_PALETTE } from "../chartCard";

interface VatStatCardProps {
  stat: VatStat;
  /** Show the "feature unavailable" overlay (API not ready yet). */
  locked?: boolean;
}

export default function VatStatCard({
  stat,
  locked = false,
}: VatStatCardProps) {
  const { currency } = useCurrency();

  const isPositive = stat.trend === "up";
  const hasData = stat.amount !== null;

  return (
    <div
      className="group relative select-none overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      <LockDimFeactureOverlay component_name="VAT Stat Cards" />
      {/* Hover info — slides up from the bottom on hover (hidden when locked) */}
      {!locked && stat.description && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3">
          <div className="translate-y-2 rounded-xl bg-slate-900/95 px-3 py-2.5 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {stat.description}
          </div>
        </div>
      )}

      <div className="relative flex h-full min-h-[170px] flex-col justify-between px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 truncate text-[13px]"
            style={{ color: CHART_PALETTE.axis }}
          >
            {stat.title}
          </h3>

          <Info
            size={13}
            className="shrink-0 transition-colors"
            style={{ color: CHART_PALETTE.subtitle }}
          />
        </div>

        {/* Value */}
        <div>
          <p
            className="text-2xl font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {stat.amount !== null
              ? formatCurrencySymbol(
                  stat.amount,
                  currency.symbol,
                  currency.locale,
                )
              : "—"}
          </p>

          {hasData && (
            <div className="mt-1 flex items-end justify-between gap-2">
              <div>
                <div className="mt-2 flex items-center gap-1.5">
                  {isPositive ? (
                    <ArrowUp size={13} style={{ color: CHART_PALETTE.good }} />
                  ) : (
                    <ArrowDown size={13} style={{ color: CHART_PALETTE.bad }} />
                  )}

                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{
                      color: isPositive
                        ? CHART_PALETTE.good
                        : CHART_PALETTE.bad,
                    }}
                  >
                    {stat.change}%
                  </span>
                </div>

                <p
                  className="mt-1 text-[11px]"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  vs last month
                </p>
              </div>

              {/* Sparkline */}
              {stat.sparkline.length > 0 && (
                <div className="flex justify-end">
                  <MiniTrendChart
                    data={stat.sparkline}
                    color={stat.chartColor}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
