"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { PriceChangeImpactItem } from "@/lib/mockData/mockInsightData";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

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
      <LockDimFeactureOverlay />

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
