"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { mockTaxRateBreakdownData } from "@/lib/mockData/mock-tax-data";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const FmtRs = (v: number) => {
  const { currency } = useCurrency();
  return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
};

export default function TaxRateBreakdown() {
  const tiers = mockTaxRateBreakdownData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <LockDimFeactureOverlay component_name="Tax Rated Breakdown" />

      <div>
        <h2 className="text-sm font-bold text-gray-900">Tax Rate Breakdown</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Sales grouped by the applied tax rate
        </p>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
        <span>Tax Tier</span>
        <span className="text-right">Taxable Base</span>
        <span className="text-right">Tax Collected</span>
        <span className="text-right">% of Total Tax</span>
      </div>

      {/* Tier rows */}
      <div className="space-y-4">
        {tiers.map((tier) => {
          const hasRevenue = tier.taxCollected > 0;
          return (
            <div key={tier.id} className="grid grid-cols-4 gap-2 items-center">
              {/* Tier label */}
              <span className="text-sm text-gray-800 font-medium">
                {tier.tierLabel}
              </span>

              {/* Taxable base */}
              <span className="text-sm text-indigo-500 font-semibold text-right">
                {FmtRs(tier.taxableBase)}
              </span>

              {/* Tax collected */}
              <span
                className={`text-sm font-bold text-right ${
                  hasRevenue ? "text-green-600" : "text-green-500"
                }`}
              >
                {hasRevenue ? FmtRs(tier.taxCollected) : "Rs 0"}
              </span>

              {/* % + progress bar */}
              <div className="flex items-center gap-2 justify-end">
                {/* Mini progress bar */}
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tier.pctOfTotal}%`,
                      backgroundColor: tier.barColor,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 w-10 text-right shrink-0">
                  {tier.pctOfTotal.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollbar hint — matches image */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-gray-300 text-sm select-none">◀</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-gray-400 rounded-full" />
        </div>
        <span className="text-gray-300 text-sm select-none">▶</span>
      </div>
    </div>
  );
}
