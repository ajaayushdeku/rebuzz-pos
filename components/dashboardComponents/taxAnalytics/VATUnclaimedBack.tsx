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
        <p className="text-4xl font-semibold tracking-tight tabular-nums text-[#1e8e3e] dark:text-[#10b981]">
          {fmt(d.stillRecoverable)}
        </p>
        <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
          still recoverable
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs tabular-nums text-[#5f6368] dark:text-[#a9b4c7]">
          <span>Claimed: {fmt(d.claimed)}</span>
          <span>Eligible: {fmt(d.eligible)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e8eaed] dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${d.claimedPct}%`,
              backgroundColor: CHART_PALETTE.good,
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#1e8e3e] dark:text-[#10b981]">
          {d.claimedPct}% of what you can claim has been claimed
        </p>
      </div>

      {/* Info note */}
      <div className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 border-[#e3e3e3] dark:border-white/10">
        <Info
          size={13}
          className="mt-0.5 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
        />
        <p className="text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
          When you buy supplies, the VAT you pay can be claimed back to lower
          your bill — but only if the purchase is logged with a valid PAN bill.
          This is money you&lsquo;re owed but haven&lsquo;t collected. Find
          these invoices to recover it.
        </p>
      </div>
    </ChartCard>
  );
}
