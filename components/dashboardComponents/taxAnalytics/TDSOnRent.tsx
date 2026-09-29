"use client";

import { Building2, Calendar } from "lucide-react";
import { mockTDSOnRentData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "../chartCard";

const STATUS_STYLES = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-400/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-400/25",
    label: "Pending Remittance",
  },
  remitted: {
    bg: "bg-green-50 dark:bg-emerald-400/10",
    text: "text-green-700 dark:text-emerald-300",
    border: "border-green-200 dark:border-emerald-400/25",
    label: "Remitted",
  },
  overdue: {
    bg: "bg-red-50 dark:bg-red-400/10",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-400/25",
    label: "Overdue",
  },
};

export default function TDSOnRent() {
  const { currency } = useCurrency();
  const d = mockTDSOnRentData;
  const statusStyle = STATUS_STYLES[d.status];

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={Building2}
      // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
      iconColor="#4f46e5"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title="TDS on Rent"
      subtitle="Track Tax Deducted at Source for rent payments"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the figures. */}
      <LockDimFeactureOverlay component_name="TDS On Rent" />

      <div className="border-t border-[#e8eaed] dark:border-white/10">
        {/* Monthly Rent */}
        <div className="flex items-start justify-between gap-3 border-b py-3.5 border-[#e8eaed] dark:border-white/10">
          <div>
            <p className="text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
              Monthly Rent Payment
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              Base rent before TDS deduction
            </p>
          </div>
          <p className="text-[13px] font-medium tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
            {fmt(d.monthlyRent)}
          </p>
        </div>

        {/* TDS to Remit */}
        <div className="flex items-center justify-between gap-3 border-b py-3.5 border-[#e8eaed] dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 bg-indigo-50 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300">
              <span className="text-[10px] font-medium tabular-nums">
                {d.tdsRate}%
              </span>
            </div>
            <p className="text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
              TDS to Remit
            </p>
          </div>
          <p className="text-[13px] font-medium tabular-nums text-[#1a73e8] dark:text-[#7ba2e3]">
            {fmt(d.tdsAmount)}
          </p>
        </div>

        {/* Due date + status */}
        <div className="flex items-center justify-between gap-3 py-3.5">
          <span className="flex items-center gap-1.5 text-xs text-[#5f6368] dark:text-[#a9b4c7]">
            <Calendar size={13} />
            Due: {d.dueDate}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
