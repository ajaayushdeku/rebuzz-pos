"use client";

import { ShoppingBag, Info } from "lucide-react";
import { mockNoVATPurchasesData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

export default function NoVATPurchases() {
  const { currency } = useCurrency();
  const d = mockNoVATPurchasesData;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={ShoppingBag}
      // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
      iconColor="#4f46e5"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title="Purchases With No VAT to Claim"
      subtitle="Tax-free items you bought — nothing to recover on these"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the figures. */}
      <LockDimFeactureOverlay component_name="No VAT Purchases" />

      {/* Two metric cols */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-[11px]" style={{ color: CHART_PALETTE.axis }}>
            No-VAT purchases
          </p>
          <p
            className="text-2xl font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.blue }}
          >
            {fmt(d.noVATPurchases)}
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {d.noVATPct}% of all buying
          </p>
        </div>
        <div>
          <p className="mb-2 text-[11px]" style={{ color: CHART_PALETTE.axis }}>
            Taxable purchases
          </p>
          <p
            className="text-2xl font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {fmt(d.taxablePurchases)}
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            VAT claimable on these
          </p>
        </div>
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
          Tax-free items (like basic foods) have no VAT — which sounds good, but
          it means there&lsquo;s nothing to claim back on them. If you sell them
          prepared at 13%, your real cost is a bit higher than it looks, since
          you could&lsquo;t recover VAT on the ingredients.
        </p>
      </div>
    </ChartCard>
  );
}
