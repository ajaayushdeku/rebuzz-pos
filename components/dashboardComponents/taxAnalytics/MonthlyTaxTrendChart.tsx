"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { Info } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useMonthlyTaxTrend } from "@/hooks/useMonthlyTaxTrend";
import { ComponentHeader } from "@/components/ComponentHeader";

const RATE_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, e) => s + (Number(e.value) || 0), 0);
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-5 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.name}</span>
          </div>
          <span className="font-bold text-gray-800">
            {formatCurrencySymbol(
              Number(entry.value) || 0,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-2 pt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-900">
          {formatCurrencySymbol(total, currency.symbol, currency.locale)}
        </span>
      </div>
    </div>
  );
};

export default function MonthlyTaxTrendChart() {
  const { currency } = useCurrency();
  const { data, isLoading, isError } = useMonthlyTaxTrend();

  const rows = data?.rows ?? [];
  const series = data?.series ?? [];
  const hasData = rows.some((r) => r.total > 0);

  const formatY = (v: number) => `${currency.symbol} ${formatCompactNumber(v)}`;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <ComponentHeader
        title="Monthly Tax Trend"
        subHeader=" Tax generated over the last 6 months, broken down by applied rate"
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-red-400">
          Failed to load tax trend
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">
          No tax data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={rows}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                tickFormatter={formatY}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                width={56}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="tax"
                  fill={RATE_COLORS[i % RATE_COLORS.length]}
                  radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2">
            {series.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{
                    backgroundColor: RATE_COLORS[i % RATE_COLORS.length],
                  }}
                />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Insight note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Each bar stacks the tax generated that month by the rate applied on
          the bills, so you can see your total tax load trending over time.
        </p>
      </div>
    </div>
  );
}
