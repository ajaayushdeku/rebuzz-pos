"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { TimeWiseProduct } from "@/lib/mockData/mockInsightData";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Time Wise Product Analysis" />

      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h2 className="text-sm font-bold text-gray-900">
          Time-Wise Product Analysis
        </h2>
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
