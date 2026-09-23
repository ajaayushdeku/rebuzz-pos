"use client";

import { FileText, Info } from "lucide-react";
import { mockTDSReceivableData } from "@/lib/mockData/mock-tax-data";
import type { TDSReceivableStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

const STATUS_CONFIG: Record<
  TDSReceivableStatus,
  { badge: string; badgeStyle: string; dotColor: string; tileClass: string }
> = {
  claimable: {
    badge: "Claimable",
    badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    dotColor: "bg-amber-400",
    tileClass: "bg-amber-50 text-amber-700",
  },
  claimed: {
    badge: "Claimed",
    badgeStyle: "bg-green-50 text-green-700 border border-green-200",
    dotColor: "bg-green-400",
    tileClass: "bg-green-50 text-green-700",
  },
};

/** One of the three totals above the list. */
function Total({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3.5 text-center"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      <p
        className="mb-1.5 text-[11px]"
        style={{ color: CHART_PALETTE.subtitle }}
      >
        {label}
      </p>
      <p
        className="text-lg font-semibold tracking-tight tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

export default function TDSReceivable() {
  const { currency } = useCurrency();
  const d = mockTDSReceivableData;

  function fmtK(v: number) {
    return v >= 1000
      ? formatCompactCurrency(v, currency.symbol, currency.locale)
      : `Rs ${v}`;
  }

  return (
    <ChartCard
      icon={FileText}
      title="TDS Receivable"
      subtitle="Tax Deducted at Source by your clients on payments made to your business"
      controls={
        <div className="shrink-0 text-right">
          <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
            Pending claim
          </p>
          <p
            className="text-lg font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.blue }}
          >
            {fmtK(d.claimable)}
          </p>
        </div>
      }
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the figures. */}
      <LockDimFeactureOverlay component_name="TDS Receivable" />

      {/* What the card is — kept, since TDS receivable is easy to misread */}
      <div
        className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
        style={{ borderColor: CHART_PALETTE.border }}
      >
        <Info
          size={13}
          className="mt-0.5 shrink-0"
          style={{ color: CHART_PALETTE.subtitle }}
        />
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: CHART_PALETTE.axis }}
        >
          <span style={{ color: CHART_PALETTE.title }}>
            What is TDS Receivable?
          </span>{" "}
          When clients pay you for services, they may deduct TDS (e.g., 15%)
          before making payment. That deducted amount belongs to you as a tax
          credit — you can claim it back when filing your income tax return.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Total
          label="Total deducted"
          value={fmtK(d.totalDeducted)}
          color={CHART_PALETTE.title}
        />
        <Total
          label="Claimed"
          value={fmtK(d.claimed)}
          color={CHART_PALETTE.good}
        />
        <Total
          label="Claimable"
          value={fmtK(d.claimable)}
          color={CHART_PALETTE.warn}
        />
      </div>

      {/* Entry list */}
      <div
        className="mt-5 border-t"
        style={{ borderColor: CHART_PALETTE.grid }}
      >
        {d.entries.map((entry) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
              style={{ borderColor: CHART_PALETTE.grid }}
            >
              {/* Left — icon + client info */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 ${cfg.tileClass}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${cfg.dotColor}`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {entry.client}
                  </p>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {entry.period} · TDS @ {entry.tdsRate}%
                  </p>
                </div>
              </div>

              {/* Right — amount + badge */}
              <div className="flex shrink-0 items-center gap-3">
                <p
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {formatCurrencySymbol(
                    entry.amount,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${cfg.badgeStyle}`}
                >
                  {cfg.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
