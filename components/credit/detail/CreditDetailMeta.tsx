"use client";

import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import {
  CREDIT_STATE_LABEL,
  CREDIT_STATE_PILL,
  type CreditState,
} from "./creditDetailHelpers";

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

/**
 * The figure row above the timeline: what state the credit is in, whose it is,
 * and what is still owed.
 *
 * Paid-so-far sits next to the due amount rather than only inside the payment
 * list — on a part-paid credit the two numbers only mean something together.
 */
export default function CreditDetailMeta({
  state,
  customerName,
  customerPhone,
  loyaltyPoint,
  isCustomerLoading,
  dueAmount,
  paidAmount,
  grandTotal,
  currency,
}: {
  state: CreditState;
  customerName: string;
  customerPhone?: string;
  loyaltyPoint?: number;
  isCustomerLoading: boolean;
  dueAmount: number;
  paidAmount: number;
  grandTotal: number;
  currency: CurrencyConfig;
}) {
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);
  const pill = CREDIT_STATE_PILL[state];
  const cleared = state !== "ongoing" || dueAmount <= 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-6">
        <div>
          <MetaLabel>Status</MetaLabel>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border relative overflow-hidden capitalize ${pill.className}`}
            style={pill.style}
          >
            {CREDIT_STATE_LABEL[state]}
          </span>
        </div>

        <div>
          <MetaLabel>Customer</MetaLabel>
          {isCustomerLoading ? (
            <div className="h-5 w-28 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-base font-bold text-blue-600">
                {customerName}
              </span>
              {/* {customerPhone && (
                <span className="text-[11px] text-gray-400 mb-0.5">
                  {customerPhone}
                </span>
              )} */}
              {!!loyaltyPoint && loyaltyPoint > 0 && (
                <p className="text-[10px] text-amber-500 font-medium whitespace-nowrap mb-0.5 font-sans">
                  ★ {formatAmount(loyaltyPoint, currency.locale)}{" "}
                  <span className=" text-[8px] text-amber-400 font-medium whitespace-nowrap mb-0.5">
                    pts
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row gap-6 font-sans">
        <div>
          <MetaLabel>Credit total</MetaLabel>
          <p className="text-xl text-right font-semibold text-gray-800">
            {fmt(grandTotal)}
          </p>
        </div>

        {paidAmount > 0 && (
          <div>
            <MetaLabel>Paid so far</MetaLabel>
            <p className="text-xl text-right font-semibold text-green-600">
              {fmt(paidAmount)}
            </p>
          </div>
        )}

        <div>
          <MetaLabel>Amount due</MetaLabel>
          <p
            className={`text-xl text-right font-semibold ${
              cleared ? "text-green-600" : "text-red-600"
            }`}
          >
            {fmt(cleared ? 0 : dueAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
