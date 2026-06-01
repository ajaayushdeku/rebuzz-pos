"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { mockGrossProfitTrendData } from "@/lib/mockData/mock-profitcostdata";
import { CustomTooltipProps } from "@/lib/types/chart";
import SampleDataBadge from "@/components/ui/sampledatabadge";

export interface ProfitTrendData {
  month: string;
  grossRevenue: number;
  netProfit: number;
}

const getYAxisTicks = (data: ProfitTrendData[]): number[] => {
  const values = data.flatMap((d) => [d.grossRevenue, d.netProfit]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  // Add 20% padding above and below
  const range = max - min;
  const paddedMin = min - range * 0.1;
  const paddedMax = max + range * 0.1;

  // Round to nice numbers
  const step = Math.ceil((paddedMax - paddedMin) / 4 / 1000) * 1000 || 1000;

  // Start from the nearest nice number below paddedMin
  const start = Math.floor(paddedMin / step) * step;

  return [0, step, step * 2, step * 3].map((v) => v + start);
};

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {formatCurrency(entry.value as number, currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {[
      { label: "Gross Revenue", color: "#60a5fa" },
      { label: "Net Profit", color: "#34d399" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

// ── Skeleton loader ───────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="h-4 bg-gray-200 rounded w-1/3" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-56 bg-gray-100 rounded-xl mt-4" />
  </div>
);

export default function GrossProfitTrendChart() {
  const { currency } = useCurrency();
  const [data, setData] = useState<ProfitTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch("/api/profit-trend")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => {
        setData(json.data ?? []);
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((d) => d.grossRevenue === 0 && d.netProfit === 0);
  const displayData = isEmpty ? mockGrossProfitTrendData : data;
  const showSampleBadge = isEmpty && !isLoading;

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrency(value, currency);

  const yTicks = getYAxisTicks(displayData);
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  if (isLoading)
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md">
        <ChartSkeleton />
      </div>
    );

  if (isError)
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Gross vs Net Profit Trend
        </h2>
        <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
          Failed to load profit data
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl px-4 py-3 border min-w-0 border-gray-100 shadow-md">
      {showSampleBadge && <SampleDataBadge />}

      <div>
        <h2 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
          Gross vs Net Profit Trend
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Monthly comparison of revenue and net profit
        </p>
      </div>

      <div className="h-44 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              ticks={yTicks}
              domain={[0, yMax]}
              width={52}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend content={<CustomLegend />} />
            <Line
              type="monotone"
              dataKey="grossRevenue"
              name="Gross Revenue"
              stroke="#60a5fa"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#60a5fa",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              name="Net Profit"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#34d399", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#34d399",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
