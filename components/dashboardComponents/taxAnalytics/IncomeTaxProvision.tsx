"use client";

import { Info, ArrowRight } from "lucide-react";
import { mockIncomeTaxProvisionData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

export default function IncomeTaxProvision() {
  const { currency } = useCurrency();

  const d = mockIncomeTaxProvisionData;

  const fmtRs = (v: number) => {
    return formatCurrencySymbol(v, currency.symbol, currency.locale);
  };

  return (
    <div className="relative bg-gray-900 rounded-2xl p-6 flex flex-col gap-5">
      <LockDimFeactureOverlay component_name="Income Tax Provision" />

      {/* Header */}
      <ComponentHeader
        title="Income Tax Provision"
        subHeader=" Annual income tax estimate based on current month profit — accrued
          monthly for accurate reporting"
        titleColor="text-white"
      />

      {/* Top row — 3 metric boxes */}
      <div className="flex items-stretch gap-3">
        {/* Net Profit Pre-Tax */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Net Profit (Pre-Tax)
          </p>
          <p className="text-2xl font-bold text-white">
            {fmtRs(d.netProfitPreTax)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            This month&lsquo;s earnings before tax
          </p>
        </div>

        {/* Arrow + rate */}
        <div className="flex flex-col items-center justify-center gap-1 px-2 shrink-0">
          <p className="text-xs font-semibold text-gray-400">
            ×{d.annualTaxRate}%
          </p>
          <ArrowRight size={16} className="text-gray-500" />
        </div>

        {/* Annual Tax Rate */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Annual Tax Rate
          </p>
          <p className="text-3xl font-bold text-white">{d.annualTaxRate}%</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Corporate income tax rate
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center px-2 shrink-0">
          <ArrowRight size={16} className="text-gray-500" />
        </div>

        {/* Net Profit After Tax — green accent */}
        <div className="flex-1 bg-emerald-900/40 border border-emerald-800/50 rounded-xl p-4">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
            Net Profit (After Tax)
          </p>
          <p className="text-2xl font-bold text-emerald-400">
            {fmtRs(d.netProfitAfterTax)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">
            What you actually keep
          </p>
        </div>
      </div>

      {/* Bottom row — 2 metric boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Annual Provision
          </p>
          <p className="text-xl font-bold text-white">
            {fmtRs(d.annualProvision)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Total tax for the year if profit holds
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Monthly Accrual
          </p>
          <p className="text-xl font-bold text-amber-400">
            {formatCurrencySymbol(
              d.monthlyAccrual,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Set aside each month to avoid surprises
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-gray-800/60 rounded-xl px-4 py-3">
        <Info size={13} className="text-gray-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">{d.note}</p>
      </div>
    </div>
  );
}
