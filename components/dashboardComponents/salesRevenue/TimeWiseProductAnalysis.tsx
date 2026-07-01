"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { TimeWiseProduct } from "@/lib/mockData/mockInsightData";

interface TimeWiseProductAnalysisProps {
  data: TimeWiseProduct[];
}

export default function TimeWiseProductAnalysis({
  data,
}: TimeWiseProductAnalysisProps) {
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>
      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Time-Wise Product Analysis
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Top performing products specific to times of day
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.map((item) => (
          <div
            key={item.period}
            className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {item.title}
            </p>

            <h3 className="mt-3 text-sm font-semibold text-gray-800">
              {item.productName}
            </h3>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">
                {item.unitsSold} units
              </span>
              <span className="text-xs font-semibold text-green-600">
                {fmt(item.revenue)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
