"use client";

import { CreditCard, Info } from "lucide-react";
import { mockVATUnclaimedData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

export default function VATUnclaimedBack() {
  const { currency } = useCurrency();
  const d = mockVATUnclaimedData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="VAT Unclaimed Back" />
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <CreditCard size={15} className="text-green-600" />
        </div>

        <ComponentHeader
          title=" VAT You Haven't Claimed Back"
          subHeader="VAT you paid suppliers but haven't recovered yet"
        />
      </div>

      {/* Big number */}
      <div className="text-center py-2">
        <p className="text-4xl font-bold text-green-600">
          {formatCurrencySymbol(
            d.stillRecoverable,
            currency.symbol,
            currency.locale,
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">still recoverable</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            Claimed::{" "}
            {formatCurrencySymbol(d.claimed, currency.symbol, currency.locale)}
          </span>
          <span>
            Eligible:{" "}
            {formatCurrencySymbol(d.eligible, currency.symbol, currency.locale)}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${d.claimedPct}%` }}
          />
        </div>
        <p className="text-[11px] text-green-600 font-medium mt-1.5">
          {d.claimedPct}% of what you can claim has been claimed
        </p>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          When you buy supplies, the VAT you pay can be claimed back to lower
          your bill — but only if the purchase is logged with a valid PAN bill.
          This is money you&lsquo;re owed but haven&lsquo;t collected. Find
          these invoices to recover it.
        </p>
      </div>
    </div>
  );
}
