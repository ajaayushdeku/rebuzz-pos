"use client";

import { useState, useMemo, useCallback } from "react";
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

import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { CurrencyConfig, useCurrency } from "@/providers/CurrencyContext";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import { ChartColumnBig } from "lucide-react";
import RangeBadge from "@/components/ui/RangeBadge";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartPager,
  ChartTooltipBox,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

// ── Types ─────────────────────────────────────────────────────────────────

type ChartDataPoint = {
  category: string;
  grossRevenue: number;
  cogs: number;
  netProfit: number;
};

// This card's own set, so it does not read as a copy of Revenue vs Profit:
// revenue in the muted blue, the cost in yellow, profit in a light green.
const GROSS_COLOR = CHART_PALETTE.darkBlue;
const COGS_COLOR = "#fbb104";
const NET_COLOR = "#2dc656";

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
  const cogsRatio = grossVal > 0 ? Math.round((cogsVal / grossVal) * 100) : 0;

  return (
    <ChartTooltipBox
      label={<span className="block max-w-40 truncate">{label}</span>}
      rows={payload.map((entry) => ({
        name: String(entry.name),
        color: entry.color as string,
        value: (
          // A loss reads in red.
          <span
            style={
              entry.dataKey === "netProfit" && (entry.value as number) < 0
                ? { color: CHART_PALETTE.bad }
                : undefined
            }
          >
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        ),
      }))}
      footer={
        <>
          {/* Gross → COGS → Net, as shares of the gross. */}
          <div className="flex justify-between gap-4 text-xs">
            <span style={{ color: CHART_PALETTE.axis }}>Margin</span>
            <span
              className="font-medium"
              style={{
                color:
                  margin >= 40
                    ? CHART_PALETTE.good
                    : margin >= 20
                      ? CHART_PALETTE.warn
                      : CHART_PALETTE.bad,
              }}
            >
              {margin}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span style={{ color: CHART_PALETTE.axis }}>COGS ratio</span>
            {/* The COGS yellow is too pale to read as text on white; its
                dark shade carries the figure. */}
            <span className="font-medium" style={{ color: "#b06000" }}>
              {cogsRatio}%
            </span>
          </div>
        </>
      }
    />
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

  // ── Y-axis: round-number steps, below zero only for a visible loss ────
  const allValues = displayData.flatMap((d) => [
    d.grossRevenue,
    d.cogs,
    d.netProfit,
  ]);
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  // A loss too small to see as a bar does not get its own step below zero;
  // the tooltip still shows it.
  const ticks = niceTicks(
    minValue < 0 && -minValue >= 0.02 * Math.max(maxValue, 1) ? minValue : 0,
    maxValue,
  );

  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  const firstShown = page * ITEMS_PER_PAGE + 1;
  const lastShown = Math.min(allChartData.length, (page + 1) * ITEMS_PER_PAGE);

  return (
    <ChartCard
      icon={ChartColumnBig}
      title="Gross Revenue vs COGS vs Net Profit"
      info={{
        heading: "Reading this chart",
        // From the POS category report: net profit there is revenue less
        // tax and cost price, and COGS here is revenue less that profit.
        body: "Each category's sales in the date range at the top of the page, highest revenue first. Net profit is revenue less tax and the items' cost prices, and COGS is revenue less that profit — so it includes the tax collected as well as the cost of the goods. Hover a category for its margin and COGS ratio.",
      }}
      subtitle="Per-category breakdown of revenue, cost, and profitability"
      controls={
        <>
          {allChartData.length > ITEMS_PER_PAGE && (
            <ChartPager
              first={firstShown}
              last={lastShown}
              total={allChartData.length}
              onPrev={goToPrevPage}
              onNext={goToNextPage}
              itemLabel="categories"
            />
          )}
          <RangeBadge variant="pill" />
        </>
      }
    >
      {isError && (
        <p className="-mt-2 mb-3 text-xs text-amber-600">
          Could not refresh — showing last known data.
        </p>
      )}

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

      {/* Empty state */}
      {!isFetching && allChartData.length === 0 ? (
        <div
          className="flex h-56 flex-col items-center justify-center sm:h-72"
          style={{ color: CHART_PALETTE.axis }}
        >
          <p className="text-sm">No category data for this date range</p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Try adjusting the filter above
          </p>
        </div>
      ) : (
        <>
          <div
            className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  barCategoryGap="15%"
                  barGap={2}
                >
                  <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={{ stroke: CHART_PALETTE.control }}
                    tickSize={6}
                    tick={AXIS_TICK}
                    interval={0}
                    // Truncate long category names on X axis
                    tickFormatter={(val: string) =>
                      val.length > 12 ? val.slice(0, 11) + "…" : val
                    }
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    ticks={ticks}
                    domain={[ticks[0], ticks[ticks.length - 1]]}
                    width={72}
                    label={yAxisTitle("Amount")}
                  />
                  <Tooltip
                    content={<CustomTooltip currency={currency} />}
                    cursor={{ fill: "rgba(60,64,67,0.04)" }}
                  />
                  <Bar
                    dataKey="grossRevenue"
                    name="Gross Revenue"
                    fill={GROSS_COLOR}
                    maxBarSize={55}
                    radius={BAR_RADIUS}
                  />
                  <Bar
                    dataKey="cogs"
                    name="COGS"
                    fill={COGS_COLOR}
                    maxBarSize={55}
                    radius={BAR_RADIUS}
                  />
                  <Bar
                    dataKey="netProfit"
                    name="Net Profit"
                    fill={NET_COLOR}
                    maxBarSize={55}
                    radius={BAR_RADIUS}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ChartLegend
            items={[
              { label: "Gross Revenue", color: GROSS_COLOR, shape: "dot" },
              { label: "COGS", color: COGS_COLOR, shape: "square" },
              { label: "Net Profit", color: NET_COLOR, shape: "square" },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}
