"use client";

import { Gauge, DoorOpen, TrendingUp } from "lucide-react";

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
    <div className="grid grid-cols-3 md:grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Occupancy */}
      <StatBox
        label="Occupancy"
        value={`${occupancyPct}%`}
        icon={<Gauge size={14} className="text-blue-500 sm:size-[16px]" />}
        iconBg="bg-blue-50"
      >
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
      </StatBox>

      {/* Open tables */}
      <StatBox
        label="Open Tables"
        value={openTables.toLocaleString()}
        icon={<DoorOpen size={14} className="text-green-500 sm:size-[16px]" />}
        iconBg="bg-green-50"
      >
        <p className="text-[11px] sm:text-xs text-gray-400">
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
        icon={
          <TrendingUp size={14} className="text-amber-500 sm:size-[16px]" />
        }
        iconBg="bg-amber-50"
      >
        <p className="text-[11px] sm:text-xs text-gray-400">
          Open checks on floor
        </p>
      </StatBox>
    </div>
  );
}

// ── Shared stat box — mirrors OverviewStatBox layout ──────────────────────────
function StatBox({
  label,
  value,
  icon,
  iconBg,
  children,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border shadow-sm px-4 sm:px-5 md:px-6 pt-3 sm:pt-4 pb-4 sm:pb-5 hover:shadow-md transition-shadow duration-200">
      {/* Label + Icon */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-[12px] font-medium text-gray-500 truncate mr-2">
          {label}
        </span>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <p className="text-xl sm:text-[20px] md:text-[22px] font-bold text-gray-900 tracking-tight mb-1 sm:mb-1.5">
        {value}
      </p>

      {/* Sub-line */}
      {children}
    </div>
  );
}
