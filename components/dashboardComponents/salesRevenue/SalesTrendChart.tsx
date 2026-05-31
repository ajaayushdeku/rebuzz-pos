"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import type { CustomTooltipProps } from "@/lib/types/chart";
import type { CompareSalesPoint } from "@/services/dashboardServices/apiSalesCompare";
import { useSalesTrends } from "@/hooks/useSalesTrends";

// Types
type ViewMode = "daily" | "weekly" | "monthly";

export interface SalesTrendsData {
  label: string;
  totalSales: number;
  totalRevenue: number;
}

// Helpers
const getYAxisTicks = (data: CompareSalesPoint[]): number[] => {
  const max = Math.max(...data.map((d) => d.totalRevenue));
  const step = Math.ceil(max / 4 / 1000) * 1000;
  return [0, step, step * 2, step * 3, step * 4];
};

// Sub-components
const CustomBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[8, 8, 0, 0]} fill="#a78bfa" />
);

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-violet-500 font-bold text-sm">
        {formatCurrency(payload[0].value as number, currency)}
      </p>
    </div>
  );
};

const VIEW_OPTIONS: {
  label: string;
  value: ViewMode;
}[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

// Loading skeleton
const ChartSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="h-4 bg-gray-200 rounded w-1/3" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-55 sm:h-75 bg-gray-100 rounded-xl mt-4" />
  </div>
);

// Chart

export default function SalesTrendChart() {
  const [view, setView] = useState<ViewMode>("weekly");
  const { currency } = useCurrency();
  const { data: rawData, isLoading, isError, error } = useSalesTrends(view);

  // console.log("Sales Compare:", rawData);

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrency(value, currency);

  const yTicks = rawData ? getYAxisTicks(rawData) : [0, 0, 0, 0, 0];
  const yMax = yTicks[yTicks.length - 1] * 1.08;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
            Sales Trends
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Revenue over time – switch between daily, weekly, and monthly views
          </p>
        </div>
        {/* View switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 self-start">
          {VIEW_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && <ChartSkeleton />}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center h-55 sm:h-75 text-gray-400">
          <p className="text-sm">Failed to load sales data</p>
          <p className="text-xs mt-1 text-gray-300">
            {error?.message ?? "Please try again later"}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (!rawData || rawData.length === 0) && (
        <div className="flex items-center justify-center h-55 sm:h-75 text-gray-400">
          <p className="text-sm">No sales data available</p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isError && rawData && rawData.length > 0 && (
        <div className="h-55 sm:h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rawData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 13,
                }}
                dy={8}
              />

              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                ticks={yTicks}
                domain={[0, yMax]}
                width={40}
              />

              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{
                  fill: "rgba(167,139,250,0.06)",
                }}
              />

              <Bar dataKey="totalRevenue" shape={CustomBar} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
