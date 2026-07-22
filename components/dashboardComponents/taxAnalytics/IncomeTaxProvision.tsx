"use client";

import { Info, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

// Statutory corporate income tax rate (Nepal). This is a government rate, not a
// business metric — no API provides it, so it's a fixed constant.
const ANNUAL_TAX_RATE = 25; // %

interface ProfitTrendRow {
  month: string;
  grossRevenue: number;
  netProfit: number;
}

/**
 * 12-month net-profit series from the profit-trend endpoint. The last entry is
 * the current month (month-to-date); the sum is the trailing-12-month profit.
 */
async function fetchProfitTrend(): Promise<ProfitTrendRow[]> {
  const res = await fetch("/api/profit-trend");
  if (!res.ok) throw new Error(`Failed to fetch profit trend: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as ProfitTrendRow[];
}

export default function IncomeTaxProvision() {
  const { currency } = useCurrency();
  const fmtRs = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["income-tax-provision"],
    queryFn: fetchProfitTrend,
    staleTime: 5 * 60 * 1000,
  });

  // Derive the provision figures. Income tax applies to profit, not losses, so
  // the taxable base is clamped at 0.
  const rate = ANNUAL_TAX_RATE / 100;
  const netProfitPreTax = data?.length ? data[data.length - 1].netProfit : 0;
  const annualNetProfit = (data ?? []).reduce((s, m) => s + m.netProfit, 0);

  const netProfitAfterTax =
    netProfitPreTax - Math.max(0, netProfitPreTax) * rate;
  const annualProvision = Math.max(0, annualNetProfit) * rate;
  const monthlyAccrual = annualProvision / 12;

  const note = `Income tax is calculated annually but provisioned monthly. Setting aside about ${fmtRs(
    monthlyAccrual,
  )} each month keeps you covered — your actual payment is made in advance installments or at year-end filing.`;

  return (
    <div className="relative bg-gray-900 rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <ComponentHeader
        title="Income Tax Provision"
        subHeader=" Annual income tax estimate based on current month profit — accrued
          monthly for accurate reporting"
        titleColor="text-white"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="ml-2 text-sm">Loading provision...</span>
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-sm text-red-400">
          Couldn&apos;t load income tax provision. Please try again.
        </div>
      ) : (
        <>
          {/* Top row — 3 metric boxes */}
          <div className="flex items-stretch gap-3">
            {/* Net Profit Pre-Tax */}
            <div className="flex-1 bg-gray-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Net Profit (Pre-Tax)
              </p>
              <p className="text-2xl font-bold text-white">
                {fmtRs(netProfitPreTax)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                This month&lsquo;s earnings before tax
              </p>
            </div>

            {/* Arrow + rate */}
            <div className="flex flex-col items-center justify-center gap-1 px-2 shrink-0">
              <p className="text-xs font-semibold text-gray-400">
                ×{ANNUAL_TAX_RATE}%
              </p>
              <ArrowRight size={16} className="text-gray-500" />
            </div>

            {/* Annual Tax Rate */}
            <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Annual Tax Rate
              </p>
              <p className="text-3xl font-bold text-white">
                {ANNUAL_TAX_RATE}%
              </p>
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
                {fmtRs(netProfitAfterTax)}
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
                {fmtRs(annualProvision)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Estimated tax on the last 12 months of profit
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Monthly Accrual
              </p>
              <p className="text-xl font-bold text-amber-400">
                {fmtRs(monthlyAccrual)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Set aside each month to avoid surprises
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 bg-gray-800/60 rounded-xl px-4 py-3">
            <Info size={13} className="text-gray-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400 leading-relaxed">{note}</p>
          </div>
        </>
      )}
    </div>
  );
}
