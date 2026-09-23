"use client";

import { Building2, Calendar } from "lucide-react";
import { mockTDSOnRentData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

const STATUS_STYLES = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Pending Remittance",
  },
  remitted: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Remitted",
  },
  overdue: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
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

      <div className="border-t" style={{ borderColor: CHART_PALETTE.grid }}>
        {/* Monthly Rent */}
        <div
          className="flex items-start justify-between gap-3 border-b py-3.5"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
          <div>
            <p className="text-[13px]" style={{ color: CHART_PALETTE.title }}>
              Monthly Rent Payment
            </p>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Base rent before TDS deduction
            </p>
          </div>
          <p
            className="text-[13px] font-medium tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {fmt(d.monthlyRent)}
          </p>
        </div>

        {/* TDS to Remit */}
        <div
          className="flex items-center justify-between gap-3 border-b py-3.5"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 bg-indigo-50 text-indigo-700">
              <span className="text-[10px] font-medium tabular-nums">
                {d.tdsRate}%
              </span>
            </div>
            <p className="text-[13px]" style={{ color: CHART_PALETTE.title }}>
              TDS to Remit
            </p>
          </div>
          <p
            className="text-[13px] font-medium tabular-nums"
            style={{ color: CHART_PALETTE.blue }}
          >
            {fmt(d.tdsAmount)}
          </p>
        </div>

        {/* Due date + status */}
        <div className="flex items-center justify-between gap-3 py-3.5">
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: CHART_PALETTE.axis }}
          >
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
