"use client";

import { CreditCard, Info } from "lucide-react";
import { mockVATUnclaimedData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

export default function VATUnclaimedBack() {
  const { currency } = useCurrency();
  const d = mockVATUnclaimedData;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={CreditCard}
      // Green, as before: Tailwind's green-600 / green-200 / green-50.
      iconColor="#16a34a"
      iconBorder="#bbf7d0"
      iconBg="#f0fdf4"
      title="VAT You Haven't Claimed Back"
      subtitle="VAT you paid suppliers but haven't recovered yet"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the figures. */}
      <LockDimFeactureOverlay component_name="VAT Unclaimed Back" />

      {/* Big number */}
      <div className="py-2 text-center">
        <p
          className="text-4xl font-semibold tracking-tight tabular-nums"
          style={{ color: CHART_PALETTE.good }}
        >
          {fmt(d.stillRecoverable)}
        </p>
        <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
          still recoverable
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div
          className="mb-1.5 flex items-center justify-between text-xs tabular-nums"
          style={{ color: CHART_PALETTE.axis }}
        >
          <span>Claimed: {fmt(d.claimed)}</span>
          <span>Eligible: {fmt(d.eligible)}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: CHART_PALETTE.grid }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${d.claimedPct}%`,
              backgroundColor: CHART_PALETTE.good,
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px]" style={{ color: CHART_PALETTE.good }}>
          {d.claimedPct}% of what you can claim has been claimed
        </p>
      </div>

      {/* Info note */}
      <div
        className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5"
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
          When you buy supplies, the VAT you pay can be claimed back to lower
          your bill — but only if the purchase is logged with a valid PAN bill.
          This is money you&lsquo;re owed but haven&lsquo;t collected. Find
          these invoices to recover it.
        </p>
      </div>
    </ChartCard>
  );
}
