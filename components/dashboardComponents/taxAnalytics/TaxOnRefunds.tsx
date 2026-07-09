"use client";

import { RotateCcw, Tag } from "lucide-react";
import { mockTaxOnRefundsData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

export default function TaxOnRefunds() {
  const { currency } = useCurrency();
  const d = mockTaxOnRefundsData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="Tax On Refunds" />

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-gray-900">Tax on Refunds</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Tax reversed for returned items
        </p>
      </div>

      {/* Two metric cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Refunded Value */}
        <div className="bg-red-50 rounded-xl p-3.5 border border-red-100">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <RotateCcw size={11} className="text-red-500" />
            </div>
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
              Refunded Value
            </p>
          </div>
          <p className="text-xl font-bold text-red-900">
            {formatCurrencySymbol(
              d.refundedValue,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {d.transactions} transactions
          </p>
        </div>

        {/* Tax Reversed */}
        <div className="bg-green-50 rounded-xl p-3.5 border border-green-100">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Tag size={11} className="text-green-600" />
            </div>
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">
              Tax Reversed
            </p>
          </div>
          <p className="text-xl font-bold text-green-700">
            {d.taxReversed < 0
              ? `- ${formatCurrencySymbol(Math.abs(d.taxReversed), currency.symbol, currency.locale)}`
              : ` ${formatCurrencySymbol(d.taxReversed, currency.symbol, currency.locale)}`}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Deducted from liability
          </p>
        </div>
      </div>
    </div>
  );
}
