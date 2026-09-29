"use client";

import { TrendingUp, TrendingDown, Tag } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { PriceChangeImpactItem } from "@/lib/mockData/mockInsightData";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { ChartCard } from "../chartCard";

interface PriceChangeImpactProps {
  data: PriceChangeImpactItem[];
}

// Good / bad colours: they carry meaning here (revenue up or down).
const UP_COLOR = "#1e8e3e";
const DOWN_COLOR = "#d93025";

const HEADINGS = [
  { label: "Item", align: "text-left pr-4" },
  { label: "Price Update", align: "text-left pr-4" },
  { label: "Weekly Rev", align: "text-left pr-4" },
  { label: "Trend", align: "text-left pr-4" },
  { label: "Volume Δ", align: "text-right" },
];

export default function PriceChangeImpact({ data }: PriceChangeImpactProps) {
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={Tag}
      title="Price Change Impact"
      subtitle="Before vs after analysis of recent menu price updates"
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card's root (the only positioned
          ancestor), so its inset-0 fills the whole card, header included. */}
      <LockDimFeactureOverlay component_name="Prime Change Impact" />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#e3e3e3] dark:border-white/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-[#f8f9fa] border-[#e3e3e3] dark:border-white/10 dark:bg-white/5">
              {HEADINGS.map((h) => (
                <th
                  key={h.label}
                  className={`px-3 py-2.5 text-[11px] font-normal ${h.align} text-[#5f6368] dark:text-[#a9b4c7]`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const positive = item.weeklyRevenueImpact > 0;
              const volumeUp = item.volumeChangePercent >= 0;
              return (
                <tr
                  key={item.id}
                  className="border-b last:border-0 border-[#e8eaed] dark:border-white/10"
                >
                  <td className="px-3 py-3.5">
                    <div className="text-[#3c4043] dark:text-[#e8ecf4]">
                      {item.productName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                      Updated {item.updatedDate}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-3.5">
                    <span className="line-through text-[#9aa0a6] dark:text-[#9aa6bd]">
                      {fmt(item.oldPrice)}
                    </span>
                    <span className="mx-1.5 text-[#dadce0] dark:text-[#3d4657]">
                      →
                    </span>
                    <span className="font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                      {fmt(item.newPrice)}
                    </span>
                  </td>

                  <td className="px-3 py-3.5">
                    <span
                      className="inline-flex items-center whitespace-nowrap font-medium"
                      style={{ color: positive ? UP_COLOR : DOWN_COLOR }}
                    >
                      {positive ? "+" : ""}
                      {fmt(item.weeklyRevenueImpact)}/wk
                    </span>
                  </td>

                  <td className="h-14 w-24 px-3 py-3.5">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={item.trend.map((v) => ({ value: v }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={positive ? UP_COLOR : DOWN_COLOR}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </td>

                  <td className="px-3 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: volumeUp ? UP_COLOR : DOWN_COLOR }}
                    >
                      {volumeUp ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
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
    </ChartCard>
  );
}
