"use client";

import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { mockVATComparisonData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

export default function WhatChangedAndWhy() {
  const { currency } = useCurrency();
  const data = mockVATComparisonData;

  const increased = data.change > 0;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <LockDimFeactureOverlay component_name="What Changed And Why" />

      <div className="flex items-center gap-2 mb-1">
        {increased ? (
          <TrendingUp size={14} className="text-amber-500" />
        ) : (
          <TrendingDown size={14} className="text-blue-500" />
        )}
        <h2 className="text-sm font-bold text-gray-900">What Changed & Why</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        Your VAT bill this month compared to last
      </p>

      {/* Comparison row */}
      <div className="flex items-center justify-between gap-4">
        {/* Last month */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Last Month
          </p>
          <p className="text-xl font-bold text-gray-500">
            {formatCurrencySymbol(
              data.lastMonth,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>

        {/* Change pill — center */}
        <div className="flex-1 flex justify-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              increased
                ? "text-amber-600 bg-amber-50"
                : "text-blue-600 bg-blue-50"
            }`}
          >
            {increased ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatCurrencySymbol(
              Math.abs(data.change),
              currency.symbol,
              currency.locale,
            )}
            ({data.changePct}%)
          </div>
        </div>

        {/* This month — blue card */}
        <div className="bg-blue-600 rounded-2xl px-5 py-3 text-right min-w-[140px]">
          <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest mb-0.5">
            This Month
          </p>
          <p className="text-2xl font-bold text-white leading-none">
            {formatCurrencySymbol(
              data.thisMonth,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>
      </div>

      {/* Reason */}
      <div className="mt-4 flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
            Why it changed
          </p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {data.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
