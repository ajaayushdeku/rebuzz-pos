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
import { useRevenueVsProfit } from "@/hooks/useRevenueVsProfit";
import { ChartColumnBig, ChevronLeft, ChevronRight } from "lucide-react";
import RangeBadge from "@/components/ui/RangeBadge";
import {
  BAR_RADIUS,
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

const REVENUE_COLOR = CHART_PALETTE.blue;
const PROFIT_COLOR = CHART_PALETTE.teal;

// Types

export interface ProductData {
  product: string;
  revenue: number;
  profit: number;
}

// Sub-components

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
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name),
        color: entry.color as string,
        value: formatCurrencySymbol(
          entry.value as number,
          currency.symbol,
          currency.locale,
        ),
      }))}
    />
  );
};

/** A round button inside the pager pill. */
const PagerButton = ({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    style={{ color: CHART_PALETTE.axis }}
  >
    {children}
  </button>
);

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
    formatCompactCurrency(value, currency.symbol, currency.locale);

  const allValues = displayData.flatMap((d) => [d.revenue, d.profit]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  // A loss too small to see as a bar does not get its own step below zero:
  // one product losing $50 beside one earning $500k would otherwise spend a
  // quarter of the chart on empty space. The tooltip still shows it.
  const ticks = niceTicks(
    minValue < 0 && -minValue >= 0.02 * Math.max(maxValue, 1) ? minValue : 0,
    maxValue,
  );

  const firstShown = page * ITEMS_PER_PAGE + 1;
  const lastShown = Math.min(allData.length, (page + 1) * ITEMS_PER_PAGE);

  return (
    <ChartCard
      icon={ChartColumnBig}
      title="Revenue vs Profit by Product"
      info={{
        heading: "Reading this chart",
        body: "Revenue is what each product sold for in the date range at the top of the page; profit is what was left after its cost. Hover a bar for the exact figures.",
      }}
      subtitle="Comparing top-line revenue against net profit per product"
      controls={
        <>
          {allData.length > ITEMS_PER_PAGE && (
            <div
              className="flex items-center gap-0.5 rounded-full border bg-white px-0.5 py-px"
              style={{ borderColor: CHART_PALETTE.control }}
            >
              <PagerButton
                onClick={goToPrevPage}
                disabled={page === 0}
                label="Previous products"
              >
                <ChevronLeft size={13} />
              </PagerButton>
              <span
                className="px-0.5 text-[11px] tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
                {firstShown}–{lastShown} of {allData.length}
              </span>
              <PagerButton
                onClick={goToNextPage}
                disabled={page >= totalPages - 1}
                label="Next products"
              >
                <ChevronRight size={13} />
              </PagerButton>
            </div>
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

      <div
        className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
      >
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              barCategoryGap="22%"
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
              <XAxis
                dataKey="product"
                axisLine={false}
                tickLine={{ stroke: CHART_PALETTE.control }}
                tickSize={6}
                tick={AXIS_TICK}
                interval={0}
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
                dataKey="revenue"
                name="Revenue"
                fill={REVENUE_COLOR}
                maxBarSize={44}
                radius={BAR_RADIUS}
              />
              <Bar
                dataKey="profit"
                name="Profit"
                fill={PROFIT_COLOR}
                maxBarSize={44}
                radius={BAR_RADIUS}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ChartLegend
        items={[
          { label: "Revenue", color: REVENUE_COLOR, shape: "dot" },
          { label: "Profit", color: PROFIT_COLOR, shape: "square" },
        ]}
      />
    </ChartCard>
  );
}
