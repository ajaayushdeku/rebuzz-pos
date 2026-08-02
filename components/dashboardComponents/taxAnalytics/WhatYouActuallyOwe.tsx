"use client";

import { Calendar, ArrowRight } from "lucide-react";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ComponentHeader } from "@/components/ComponentHeader";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

export interface WhatYouOweData {
  collected: number;
  inputVat: number;
  refund: number;
  payable: number;
  dueDate: string;
}

interface WhatYouActuallyOweProps {
  data: WhatYouOweData;
}

export default function WhatYouActuallyOwe({ data }: WhatYouActuallyOweProps) {
  const { currency } = useCurrency();

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
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full bg-emerald-50 blur-3xl opacity-70" />

        <div className="relative p-5">
          <LockDimFeactureOverlay component_name="What You Actually Owe" />

          {/* Card header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <ArrowRight size={15} className="text-indigo-600" />
              </div>
              <ComponentHeader
                title="What you actually owe"
                subHeader="Your VAT bill this month"
              />
            </div>

            <div className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 rounded-full px-3 py-1">
              <Calendar size={11} className="text-blue-500" />
              <span className="text-[11px] font-semibold text-blue-600">
                Due: {data.dueDate}
              </span>
            </div>
          </div>

          {/* Equation row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {/* Collected — VAT collected from customers */}
            <div className="flex flex-col gap-0.5 min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Collected
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrencySymbol(
                  data.collected,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
            </div>

            <span className="text-xl text-slate-300 font-light shrink-0">
              −
            </span>

            {/* Input VAT — VAT paid on purchases */}
            <div className="flex flex-col gap-0.5 min-w-[120px] text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Input VAT
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrencySymbol(
                  data.inputVat,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
            </div>

            <span className="text-xl text-slate-300 font-light shrink-0">
              −
            </span>

            {/* Refund — VAT refunds claimed */}
            <div className="flex flex-col gap-0.5 min-w-[120px] text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Refund
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrencySymbol(
                  data.refund,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight size={20} className="text-slate-400 shrink-0" />

            {/* Net VAT Payable — what you actually owe */}
            <div className="bg-blue-600 rounded-2xl px-6 py-4 text-right shrink-0 min-w-[160px]">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">
                Net VAT Payable
              </p>
              <p className="text-2xl font-bold text-white">
                {formatCurrencySymbol(
                  data.payable,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
