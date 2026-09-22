"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { CustomTooltipProps } from "@/lib/types/chart";
import { TrendingUp } from "lucide-react";
import ChartSkeleton from "@/components/ui/chartskeleton";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

export interface ProfitTrendData {
  month: string;
  grossRevenue: number;
  netProfit: number;
}

const REVENUE_COLOR = CHART_PALETTE.blue;
const PROFIT_COLOR = CHART_PALETTE.teal;

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

/** A small dot on each month, ringed in white so the two lines stay apart. */
const dot = (color: string) => ({
  r: 3,
  fill: color,
  stroke: "#fff",
  strokeWidth: 1.5,
});

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

  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  // Round-number steps, reaching below zero only when a month made a loss.
  const values = data.flatMap((d) => [d.grossRevenue, d.netProfit]);
  const ticks = niceTicks(
    values.length > 0 ? Math.min(...values) : 0,
    values.length > 0 ? Math.max(...values) : 0,
  );

  return (
    <ChartCard
      icon={TrendingUp}
      title="Gross vs Net Profit Trend"
      info={{
        heading: "Reading this chart",
        // From /api/profit-trend: compare-sales-by-month over the last 12
        // months, whose net profit is revenue less tax and cost price.
        body: "One point per calendar month over the last 12 months, this month so far included. Gross revenue is what customers paid on bills that were not refunded; net profit is that less tax and the items' cost prices — other expenses are not taken off. This card does not follow the date range at the top of the page.",
      }}
      subtitle="Monthly comparison of revenue and net profit"
    >
      {isLoading ? (
        <ChartSkeleton />
      ) : isError ? (
        <div
          className="flex h-56 items-center justify-center text-sm"
          style={{ color: CHART_PALETTE.axis }}
        >
          Failed to load profit data
        </div>
      ) : (
        <>
          <div className="h-56 sm:h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={{ stroke: CHART_PALETTE.control }}
                  tickSize={6}
                  tick={AXIS_TICK}
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
                  cursor={{ stroke: CHART_PALETTE.control, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="grossRevenue"
                  name="Gross Revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2}
                  dot={dot(REVENUE_COLOR)}
                  activeDot={{ ...dot(REVENUE_COLOR), r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke={PROFIT_COLOR}
                  strokeWidth={2}
                  dot={dot(PROFIT_COLOR)}
                  activeDot={{ ...dot(PROFIT_COLOR), r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ChartLegend
            items={[
              { label: "Gross Revenue", color: REVENUE_COLOR, shape: "dot" },
              { label: "Net Profit", color: PROFIT_COLOR, shape: "square" },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}
