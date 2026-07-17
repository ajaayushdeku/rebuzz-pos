"use client";

import { FileText, Info } from "lucide-react";
import { mockTDSReceivableData } from "@/lib/mockData/mock-tax-data";
import type { TDSReceivableStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

const STATUS_CONFIG: Record<
  TDSReceivableStatus,
  { badge: string; badgeStyle: string; dotColor: string }
> = {
  claimable: {
    badge: "Claimable",
    badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    dotColor: "bg-amber-400",
  },
  claimed: {
    badge: "Claimed",
    badgeStyle: "bg-green-50 text-green-700 border border-green-200",
    dotColor: "bg-green-400",
  },
};

export default function TDSReceivable() {
  const { currency } = useCurrency();
  const d = mockTDSReceivableData;

  function fmtK(v: number) {
    return v >= 1000
      ? `${currency.symbol} ${formatCompactNumber(v)}`
      : `Rs ${v}`;
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">
      <LockDimFeactureOverlay component_name="TDS Receivable" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-blue-600" />
          </div>

          <ComponentHeader
            title="TDS Receivable"
            subHeader="Tax Deducted at Source by your clients on payments made to your
              business"
          />
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Pending Claim
          </p>
          <p className="text-lg font-bold text-blue-600">{fmtK(d.claimable)}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <span className="font-bold">What is TDS Receivable?</span> When
          clients pay you for services, they may deduct TDS (e.g., 15%) before
          making payment. That deducted amount belongs to you as a tax credit —
          you can claim it back when filing your income tax return.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Total Deducted
          </p>
          <p className="text-lg font-bold text-gray-900">
            {fmtK(d.totalDeducted)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3.5 border border-green-100 text-center">
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1.5">
            Claimed
          </p>
          <p className="text-lg font-bold text-green-700">{fmtK(d.claimed)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100 text-center">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
            Claimable
          </p>
          <p className="text-lg font-bold text-amber-700">
            {fmtK(d.claimable)}
          </p>
        </div>
      </div>

      {/* Entry list */}
      <div className="divide-y divide-gray-50">
        {d.entries.map((entry) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              {/* Left — icon + client info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.status === "claimed" ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {entry.client}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {entry.period} · TDS @ {entry.tdsRate}%
                  </p>
                </div>
              </div>

              {/* Right — amount + badge */}
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrencySymbol(
                    entry.amount,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badgeStyle}`}
                >
                  {cfg.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
