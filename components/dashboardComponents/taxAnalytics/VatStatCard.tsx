"use client";

import MiniTrendChart, { VatStat } from "./MiniTrendChart";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

interface VatStatCardProps {
  stat: VatStat;
}

export default function VatStatCard({ stat }: VatStatCardProps) {
  const { currency } = useCurrency();

  const isPositive = stat.trend === "up";

  return (
    <div
      className=" relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
      "
    >
      <LockDimFeactureOverlay component_name="Vat Stat Card" />

      {/* Background Glow */}
      <div
        className=" absolute -top-20 -left-10 h-48 w-48 rounded-full bg-emerald-50 blur-3xl opacity-70
        "
      />

      <div
        className=" relative flex h-full min-h-[190px] flex-col justify-between p-6
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3
            className=" text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500
            "
          >
            {stat.title}
          </h3>

          <Info size={15} className="text-slate-300" />
        </div>

        {/* Value */}
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-slate-900">
            {formatCurrencySymbol(
              stat.amount,
              currency.symbol,
              currency.locale,
            )}
          </h2>

          <div className="mt-1 flex items-center justify-between gap-2">
            <div>
              <div className="mt-3 flex items-center gap-2">
                {isPositive ? (
                  <ArrowUp size={14} className="text-emerald-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-500" />
                )}

                <span
                  className={`text-[12px] font-semibold ${
                    isPositive ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {stat.change}%
                </span>
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                VS LAST MONTH
              </p>
            </div>

            {/* Sparkline */}
            <div className="mt-3 flex justify-end">
              <MiniTrendChart data={stat.sparkline} color={stat.chartColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
