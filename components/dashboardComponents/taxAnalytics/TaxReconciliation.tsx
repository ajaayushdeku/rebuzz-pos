"use client";

import { CheckCircle2, Scale } from "lucide-react";
import { mockTaxReconciliationData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ChartCard } from "../chartCard";

export default function TaxReconciliation() {
  const { currency } = useCurrency();
  const d = mockTaxReconciliationData;

  const fmtRs = (v: number) => {
    return formatCurrencySymbol(v, currency.symbol, currency.locale);
  };

  const steps = [
    { label: "Collected", value: fmtRs(d.collected), operator: null },
    { label: "VAT paid", value: fmtRs(d.vatPaid), operator: "−" },
    { label: "Refunds", value: fmtRs(d.refunds), operator: "−" },
    { label: "Remitted", value: fmtRs(d.remitted), operator: "−" },
  ];

  return (
    <ChartCard
      icon={Scale}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Tax Reconciliation"
      subtitle="What you collected, less what you have already settled"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the equation. */}
      <LockDimFeactureOverlay component_name="Tax Reconciliation" />

      {/* Equation row */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {steps.map(({ label, value, operator }) => (
            <div key={label} className="flex items-center gap-2">
              {/* Operator */}
              {operator && (
                <span className="select-none text-base font-light text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {operator}
                </span>
              )}

              {/* Metric box */}
              <div className="flex min-w-[140px] flex-col items-center gap-0.5 rounded-xl border px-6 py-3 border-[#e3e3e3] dark:border-white/10">
                <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {label}
                </p>
                <p className="text-lg font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                  {value}
                </p>
              </div>
            </div>
          ))}

          {/* Equals sign */}
          <span className="select-none px-1 text-base font-light text-[#9aa0a6] dark:text-[#9aa6bd]">
            =
          </span>

          {/* Still Owed — the answer */}
          <div className="flex min-w-[160px] flex-col items-center gap-0.5 rounded-xl bg-blue-600 px-6 py-3">
            <p className="text-[11px] text-blue-100">Still owed</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums text-white">
              {fmtRs(d.stillOwed)}
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation status banner */}
      <div
        className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 ${
          d.isReconciled
            ? "border-green-200 bg-green-50 dark:bg-emerald-400/10 dark:border-emerald-400/25"
            : "border-red-200 bg-red-50 dark:bg-red-400/10 dark:border-red-400/25"
        }`}
      >
        <CheckCircle2
          size={18}
          className={
            d.isReconciled
              ? "mt-0.5 shrink-0 text-green-600 dark:text-emerald-400"
              : "mt-0.5 shrink-0 text-red-500 dark:text-red-400"
          }
        />
        <div>
          <p
            className={`text-[13px] font-medium ${
              d.isReconciled
                ? "text-green-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {d.isReconciled ? "Accounts Reconciled" : "Reconciliation Mismatch"}
          </p>
          <p
            className={`mt-0.5 text-[11px] ${
              d.isReconciled
                ? "text-green-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {d.reconciliationMessage}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
