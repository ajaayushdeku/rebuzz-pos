"use client";

import { Gauge, DoorOpen, TrendingUp, type LucideIcon } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

interface LiveStatBarProps {
  occupancyPct: number;
  openTables: number;
  liveSales: number;
}

export default function LiveStatBar({
  occupancyPct,
  openTables,
  liveSales,
}: LiveStatBarProps) {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3">
      {/* Occupancy */}
      <StatBox
        label="Occupancy"
        value={`${occupancyPct}%`}
        icon={Gauge}
        iconClass="bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-[#7ba2e3]"
      >
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eaed] dark:bg-white/10">
          <div
            className="h-full rounded-full bg-[#1a73e8] transition-all duration-500 dark:bg-[#7ba2e3]"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </StatBox>

      {/* Open tables */}
      <StatBox
        label="Open Tables"
        value={openTables.toLocaleString()}
        icon={DoorOpen}
        iconClass="bg-green-50 text-green-600 dark:bg-emerald-400/10 dark:text-emerald-400"
      >
        <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Ready to seat now
        </p>
      </StatBox>

      {/* Live sales */}
      <StatBox
        label="Live Sales"
        value={formatCurrencySymbol(
          liveSales,
          currency.symbol,
          currency.locale,
        )}
        icon={TrendingUp}
        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
      >
        <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Open checks on floor
        </p>
      </StatBox>
    </div>
  );
}

// ── Shared stat box — the tile used across the dashboards ────────────────────
function StatBox({
  label,
  value,
  icon: Icon,
  iconClass,
  children,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Icon tile colours; its border takes the icon's own hue. */
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-[#161d2e] px-5 py-4 border-[#e3e3e3] dark:border-white/10">
      {/* Label + Icon */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-[#5f6368] dark:text-[#a9b4c7]">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Value */}
      <p className="mb-1.5 truncate text-xl font-semibold tracking-tight tabular-nums md:text-[22px] text-[#3c4043] dark:text-[#e8ecf4]">
        {value}
      </p>

      {/* Sub-line */}
      {children}
    </div>
  );
}
