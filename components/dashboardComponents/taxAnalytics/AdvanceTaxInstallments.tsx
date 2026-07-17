"use client";

import { Calendar, CheckCircle2 } from "lucide-react";
import { mockAdvanceTaxInstallments } from "@/lib/mockData/mock-tax-data";
import type { InstallmentStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

const STATUS_CONFIG: Record<
  InstallmentStatus,
  { badge: string; badgeStyle: string; rightContent: "paid" | "awaiting" }
> = {
  paid: {
    badge: "Paid",
    badgeStyle: "bg-green-100 text-green-700 border border-green-200",
    rightContent: "paid",
  },
  pending: {
    badge: "Pending",
    badgeStyle: "bg-amber-100 text-amber-700 border border-amber-200",
    rightContent: "awaiting",
  },
  awaiting: {
    badge: "",
    badgeStyle: "",
    rightContent: "awaiting",
  },
};

export default function AdvanceTaxInstallments() {
  const { currency } = useCurrency();
  const installments = mockAdvanceTaxInstallments;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
      <LockDimFeactureOverlay component_name="Advance Tax Installments" />

      {/* Header */}
      <div className="mb-4">
        <ComponentHeader
          title=" Advance Income Tax Installments"
          subHeader="Poush, Chaitra, and Ashad scheduled payments"
        />
      </div>

      {/* Installment rows */}
      <div className="divide-y divide-gray-50">
        {installments.map((inst) => {
          const cfg = STATUS_CONFIG[inst.status];
          const isPaid = inst.status === "paid";

          return (
            <div
              key={inst.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              {/* Left — period + badges + due date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">
                    {inst.period}
                  </span>

                  {/* Paid so far pill */}
                  <span className="text-[10px] font-semibold text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                    {inst.paidSoFarPct}% PAID SO FAR
                  </span>

                  {/* Status badge */}
                  {cfg.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badgeStyle}`}
                    >
                      {cfg.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                  <Calendar size={11} />
                  <span className="text-[11px]">Due: {inst.dueDate}</span>
                </div>
              </div>

              {/* Right — estimated amount + paid / awaiting */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 mb-0.5">
                    Est. Amount
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrencySymbol(
                      inst.estimatedAmount,
                      currency.symbol,
                      currency.locale,
                    )}
                  </p>
                </div>

                {isPaid ? (
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 min-w-[90px] justify-center">
                    <CheckCircle2 size={13} className="text-green-500" />
                    <span className="text-xs font-bold text-green-700">
                      {formatCurrencySymbol(
                        inst.actualPaid ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl px-4 py-1.5 min-w-[90px] text-center">
                    <span className="text-xs font-semibold text-gray-400">
                      Awaiting
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
