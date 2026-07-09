"use client";

import { Calendar, ArrowRight } from "lucide-react";
import { mockWhatYouOweData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

// ── Mini sparkline SVG (static illustrative) ──────────────────────────────
// function Sparkline({ color, up }: { color: "green" | "red"; up: boolean }) {
//   const stroke = color === "green" ? "#22c55e" : "#ef4444";
//   // Simple up or down path
//   const d = up
//     ? "M0,20 C10,18 20,10 30,12 S50,4 60,2"
//     : "M0,4 C10,6 20,14 30,12 S50,18 60,20";
//   return (
//     <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
//       <path
//         d={d}
//         stroke={stroke}
//         strokeWidth="2.5"
//         strokeLinecap="round"
//         fill="none"
//       />
//     </svg>
//   );
// }

// function fmtRs(v: number) {
//   return `Rs ${v.toLocaleString()}`;
// }

export default function WhatYouActuallyOwe() {
  const { currency } = useCurrency();
  const d = mockWhatYouOweData;

  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          What You Actually Owe
        </h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── Main equation card ── */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <LockDimFeactureOverlay component_name="What You Actualy Owe" />

        {/* Card header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-bold text-blue-700">
              What you actually owe
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Your VAT bill this month
            </p>
          </div>
          <div className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 rounded-full px-3 py-1">
            <Calendar size={11} className="text-blue-500" />
            <span className="text-[11px] font-semibold text-blue-600">
              Due: {d.dueDate}
            </span>
          </div>
        </div>

        {/* Equation row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {/* Collected */}
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Collected
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrencySymbol(
                d.collected,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>

          <span className="text-xl text-gray-300 font-light shrink-0">−</span>

          {/* Input VAT */}
          <div className="flex flex-col gap-0.5 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Input VAT
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrencySymbol(
                d.inputVAT,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>

          <span className="text-xl text-gray-300 font-light shrink-0">−</span>

          {/* Refund */}
          <div className="flex flex-col gap-0.5 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Refund
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrencySymbol(d.refund, currency.symbol, currency.locale)}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight size={20} className="text-gray-400 shrink-0" />

          {/* Net VAT Payable — blue card */}
          <div className="bg-blue-600 rounded-2xl px-6 py-4 text-right shrink-0 min-w-[160px]">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">
              Net VAT Payable
            </p>
            <p className="text-2xl font-bold text-white">
              {formatCurrencySymbol(
                d.netVATPayable,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {d.stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <Info size={12} className="text-gray-300" />
            </div>

            <p className="text-xl font-bold text-gray-900">
              Rs {stat.value.toLocaleString()}
            </p>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-bold ${
                      stat.trendColor === "green"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {stat.trend === "up" ? "↑" : "↓"} {stat.changePct}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                  vs last month
                </p>
              </div>
              <Sparkline color={stat.trendColor} up={stat.trend === "up"} />
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}
