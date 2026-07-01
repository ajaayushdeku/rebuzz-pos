"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { PriceChangeImpactItem } from "@/lib/mockData/mockInsightData";

interface PriceChangeImpactProps {
  data: PriceChangeImpactItem[];
}

export default function PriceChangeImpact({ data }: PriceChangeImpactProps) {
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full h-full relative select-none">
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
          Price Change Impact
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Before vs after analysis of recent menu price updates
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 pr-4 font-semibold text-gray-400 uppercase tracking-wide">
                Item
              </th>
              <th className="text-left py-3 pr-4 font-semibold text-gray-400 uppercase tracking-wide">
                Price Update
              </th>
              <th className="text-left py-3 pr-4 font-semibold text-gray-400 uppercase tracking-wide">
                Weekly Rev
              </th>
              <th className="text-left py-3 pr-4 font-semibold text-gray-400 uppercase tracking-wide">
                Trend
              </th>
              <th className="text-right py-3 font-semibold text-gray-400 uppercase tracking-wide">
                Volume Δ
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const positive = item.weeklyRevenueImpact > 0;
              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-gray-800">
                      {item.productName}
                    </div>
                    <div className="text-gray-400 mt-0.5">
                      Updated {item.updatedDate}
                    </div>
                  </td>

                  <td className="py-4 pr-4 whitespace-nowrap">
                    <span className="line-through text-gray-400">
                      {fmt(item.oldPrice)}
                    </span>
                    <span className="mx-1.5 text-gray-300">→</span>
                    <span className="font-semibold text-gray-800">
                      {fmt(item.newPrice)}
                    </span>
                  </td>

                  <td className="py-4 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        positive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {fmt(item.weeklyRevenueImpact)}/wk
                    </span>
                  </td>

                  <td className="py-4 pr-4 w-24 h-14">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={item.trend.map((v) => ({ value: v }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={positive ? "#22c55e" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </td>

                  <td className="py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        item.volumeChangePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.volumeChangePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(item.volumeChangePercent)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
