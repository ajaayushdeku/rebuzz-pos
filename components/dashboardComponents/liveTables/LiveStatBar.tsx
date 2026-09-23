"use client";

import { Gauge, DoorOpen, TrendingUp, type LucideIcon } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE } from "../chartCard";

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
        iconClass="bg-blue-50 text-blue-600"
      >
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: CHART_PALETTE.grid }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${occupancyPct}%`,
              backgroundColor: CHART_PALETTE.blue,
            }}
          />
        </div>
      </StatBox>

      {/* Open tables */}
      <StatBox
        label="Open Tables"
        value={openTables.toLocaleString()}
        icon={DoorOpen}
        iconClass="bg-green-50 text-green-600"
      >
        <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
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
        iconClass="bg-amber-50 text-amber-600"
      >
        <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
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
    <div
      className="rounded-2xl border bg-white px-5 py-4"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      {/* Label + Icon */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className="truncate text-[13px]"
          style={{ color: CHART_PALETTE.axis }}
        >
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Value */}
      <p
        className="mb-1.5 truncate text-xl font-semibold tracking-tight tabular-nums md:text-[22px]"
        style={{ color: CHART_PALETTE.title }}
      >
        {value}
      </p>

      {/* Sub-line */}
      {children}
    </div>
  );
}
