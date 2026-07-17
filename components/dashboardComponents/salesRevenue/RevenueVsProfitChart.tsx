"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";

import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { CurrencyConfig, useCurrency } from "@/providers/CurrencyContext";
import { useRevenueVsProfit } from "@/hooks/useRevenueVsProfit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";

// Types

export interface ProductData {
  product: string;
  revenue: number;
  profit: number;
}

// Sub-components

const RevenueBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#60a5fa" />
);

const ProfitBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#34d399" />
);

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {[
      { label: "Profit", color: "#34d399" },
      { label: "Revenue", color: "#60a5fa" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyConfig;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-36">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color as string,
              }}
            />
            <span className="text-xs text-gray-600 capitalize">
              {entry.name}
            </span>
          </div>
          <span className={`text-xs font-bold text-gray-800 `}>
            {/* {formatCurrency(entry.value as number, currency)} */}
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

// Chart — fetches data via hook

export default function RevenueVsProfitChart({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(0);

  const { data, isFetching, isError } = useRevenueVsProfit(startDate, endDate);
  const { currency } = useCurrency();

  const allData = useMemo<ProductData[]>(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(allData.length / ITEMS_PER_PAGE));

  const chartData = useMemo<ProductData[]>(() => {
    const start = page * ITEMS_PER_PAGE;
    return allData.slice(start, start + ITEMS_PER_PAGE);
  }, [allData, page]);

  const displayData =
    chartData.length > 0
      ? chartData
      : [
          {
            product: "No Data",
            revenue: 0,
            profit: 0,
          },
        ];

  const goToPrevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const formatYAxis = (value: number): string =>
    `${currency.symbol} ${formatCompactNumber(value)}`;

  // ── Dynamic Y-axis that handles negative profit ──
  const allValues =
    displayData.length > 0
      ? displayData.flatMap((d) => [d.revenue, d.profit])
      : [0];

  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  const yAxisMax = Math.max(1000, Math.ceil(maxValue / 500) * 500 + 1000);
  const yAxisMin = minValue < 0 ? Math.floor(minValue / 500) * 500 - 500 : 0;

  const tickRange = yAxisMax - yAxisMin;
  const tickStep = Math.ceil(tickRange / 5 / 500) * 500;
  const ticks = Array.from(
    { length: Math.ceil(tickRange / tickStep) + 1 },
    (_, i) => yAxisMin + i * tickStep,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full">
      {/* Header */}
      <div className="mb-6">
        <ComponentHeader
          title="Revenue vs Profit by Product"
          subHeader="Comparing top-line revenue against net profit per product"
        />

        {isError && (
          <p className="text-xs text-amber-400 mt-1">
            Could not refresh — showing last known data.
          </p>
        )}
      </div>

      {/* Chart */}
      <div
        className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
      >
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
              barCategoryGap="15%"
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="product"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                interval={0}
                dy={8}
                tickFormatter={(val: string) =>
                  val.length > 10 ? val.slice(0, 9) + "…" : val
                }
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                domain={[yAxisMin, yAxisMax]}
                width={55}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{
                  fill: "rgba(0,0,0,0.03)",
                }}
              />
              <Legend content={<CustomLegend />} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                shape={RevenueBar}
                fill="#60a5fa"
              />
              <Bar
                dataKey="profit"
                name="Profit"
                shape={ProfitBar}
                fill="#34d399"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pagination controls */}
      {allData.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={goToPrevPage}
            disabled={page === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              page === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-xs text-gray-400 font-medium">
            Page {page + 1} of {totalPages} · {allData.length} products
          </span>
          <button
            onClick={goToNextPage}
            disabled={page >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              page >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
