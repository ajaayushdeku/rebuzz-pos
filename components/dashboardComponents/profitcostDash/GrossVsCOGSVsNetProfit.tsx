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
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";

// ── Types ─────────────────────────────────────────────────────────────────

type ChartDataPoint = {
  category: string;
  grossRevenue: number;
  cogs: number;
  netProfit: number;
};

// ── Bar shapes ────────────────────────────────────────────────────────────

const GrossRevenueBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#9ca3af" />
);

const COGSBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#f472b6" />
);

const NetProfitBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#60a5fa" />
);

// ── Legend ────────────────────────────────────────────────────────────────

const CustomLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
    {[
      { label: "Gross Revenue", color: "#9ca3af" },
      { label: "COGS", color: "#f472b6" },
      { label: "Net Profit", color: "#60a5fa" },
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

// ── Tooltip ───────────────────────────────────────────────────────────────

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

  const gross = payload.find((p) => p.dataKey === "grossRevenue");
  const cogs = payload.find((p) => p.dataKey === "cogs");
  const net = payload.find((p) => p.dataKey === "netProfit");

  const grossVal = (gross?.value as number) ?? 0;
  const cogsVal = (cogs?.value as number) ?? 0;
  const netVal = (net?.value as number) ?? 0;

  const margin = grossVal > 0 ? Math.round((netVal / grossVal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-44">
      <p className="text-gray-400 text-xs mb-2 font-medium truncate max-w-40">
        {label}
      </p>

      {payload.map((entry) => (
        <div
          key={entry.dataKey as string}
          className="flex items-center justify-between gap-4 mb-0.5"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span
            className={`text-xs font-bold ${
              entry.dataKey === "netProfit" && (entry.value as number) < 0
                ? "text-red-500"
                : "text-gray-800"
            }`}
          >
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}

      {/* Gross → COGS → Net breakdown */}
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Margin</span>
          <span
            className={`font-bold ${margin >= 40 ? "text-green-500" : margin >= 20 ? "text-yellow-500" : "text-red-400"}`}
          >
            {margin}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">COGS ratio</span>
          <span className="font-semibold text-pink-500">
            {grossVal > 0 ? Math.round((cogsVal / grossVal) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────

const skeletonHeights = Array.from(
  { length: 6 },
  () => 60 + Math.random() * 80,
);

const ChartSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="flex gap-2">
      {skeletonHeights.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg bg-gray-100"
          style={{
            height: `${height}px`,
            alignSelf: "flex-end",
          }}
        />
      ))}
    </div>
    <div className="h-px bg-gray-100 w-full" />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────

export default function GrossVsCOGSVsNetProfit({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();

  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(0);

  const {
    data: categories,
    isFetching,
    isError,
  } = useSalesByCategory(startDate, endDate);

  // Transform CategorySalesData[] → ChartDataPoint[]
  // COGS is derived as: totalRevenue - netProfit
  const allChartData = useMemo<ChartDataPoint[]>(() => {
    if (!categories || categories.length === 0) return [];

    return categories
      .filter((c) => c.totalRevenue > 0) // exclude zero-revenue categories
      .sort((a, b) => b.totalRevenue - a.totalRevenue) // highest revenue first
      .map((c) => ({
        category: c.name,
        grossRevenue: c.totalRevenue,
        cogs: c.totalRevenue - c.netProfit,
        netProfit: c.netProfit,
      }));
  }, [categories]);

  const totalPages = Math.max(
    1,
    Math.ceil(allChartData.length / ITEMS_PER_PAGE),
  );

  // Reset page when data changes
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const start = page * ITEMS_PER_PAGE;
    return allChartData.slice(start, start + ITEMS_PER_PAGE);
  }, [allChartData, page]);

  const displayData: ChartDataPoint[] =
    chartData.length > 0
      ? chartData
      : [{ category: "No Data", grossRevenue: 0, cogs: 0, netProfit: 0 }];

  const goToPrevPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  // ── Dynamic Y-axis (handles negative net profit) ──────────────────────
  const allValues = displayData.flatMap((d) => [
    d.grossRevenue,
    d.cogs,
    d.netProfit,
  ]);
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);

  const yAxisMax = Math.max(1000, Math.ceil(maxValue / 500) * 500 + 500);
  const yAxisMin = minValue < 0 ? Math.floor(minValue / 500) * 500 - 500 : 0;
  const tickRange = yAxisMax - yAxisMin;
  const tickStep = Math.max(500, Math.ceil(tickRange / 6 / 500) * 500);
  const yTicks = Array.from(
    { length: Math.ceil(tickRange / tickStep) + 1 },
    (_, i) => yAxisMin + i * tickStep,
  );

  const formatYAxis = (value: number): string =>
    `${currency.symbol} ${formatCompactNumber(value)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full">
      {/* Header */}
      <div className="mb-6">
        <ComponentHeader
          title="Gross Revenue vs COGS vs Net Profit"
          subHeader="Per-category breakdown of revenue, cost, and profitability"
        />

        {isError && (
          <p className="text-xs text-amber-400 mt-1">
            Could not refresh — showing last known data.
          </p>
        )}
      </div>

      {/* Summary pills */}
      {/* {chartData.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {(() => {
            const totalGross = chartData.reduce(
              (s, d) => s + d.grossRevenue,
              0,
            );
            const totalCOGS = chartData.reduce((s, d) => s + d.cogs, 0);
            const totalNet = chartData.reduce((s, d) => s + d.netProfit, 0);
            const overallMargin =
              totalGross > 0 ? Math.round((totalNet / totalGross) * 100) : 0;

            return [
              {
                label: "Gross Revenue",
                value: formatCurrencySymbol(
                  totalGross,
                  currency.symbol,
                  currency.locale,
                ),
                color: "bg-gray-100 text-gray-700",
              },
              {
                label: "COGS",
                value: formatCurrencySymbol(
                  totalCOGS,
                  currency.symbol,
                  currency.locale,
                ),
                color: "bg-pink-50 text-pink-700",
              },
              {
                label: "Net Profit",
                value: formatCurrencySymbol(
                  totalNet,
                  currency.symbol,
                  currency.locale,
                ),
                color:
                  totalNet >= 0
                    ? "bg-blue-50 text-blue-700"
                    : "bg-red-50 text-red-700",
              },
              {
                label: "Avg Margin",
                value: `${overallMargin}%`,
                color:
                  overallMargin >= 40
                    ? "bg-green-50 text-green-700"
                    : overallMargin >= 20
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}
              >
                <span className="text-[10px] opacity-70">{label}</span>
                <span>{value}</span>
              </div>
            ));
          })()}
        </div>
      )} */}

      {/* Chart */}
      <div
        className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
      >
        {/* {isFetching && chartData.length === 0 ? (
          <div className="h-56 sm:h-72 flex items-end pb-4">
            <div className="w-full">
              <ChartSkeleton />
            </div>
          </div>
        ) : ( */}
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              barCategoryGap="20%"
              barGap={3}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />

              <XAxis
                dataKey="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                dy={8}
                interval={0}
                // Truncate long category names on X axis
                tickFormatter={(val: string) =>
                  val.length > 10 ? val.slice(0, 9) + "…" : val
                }
              />

              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                ticks={yTicks}
                domain={[yAxisMin, yAxisMax]}
                width={58}
              />

              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />

              <Legend content={<CustomLegend />} />

              <Bar
                dataKey="grossRevenue"
                name="Gross Revenue"
                shape={GrossRevenueBar}
                fill="#9ca3af"
              />
              <Bar dataKey="cogs" name="COGS" shape={COGSBar} fill="#f472b6" />
              <Bar
                dataKey="netProfit"
                name="Net Profit"
                shape={NetProfitBar}
                fill="#60a5fa"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* )} */}
      </div>

      {/* Pagination controls */}
      {allChartData.length > ITEMS_PER_PAGE && (
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
            Page {page + 1} of {totalPages} · {allChartData.length} categories
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

      {/* Empty state */}
      {!isFetching && allChartData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p className="text-sm">No category data for this date range</p>
          <p className="text-xs mt-1">Try adjusting the filter above</p>
        </div>
      )}
    </div>
  );
}
