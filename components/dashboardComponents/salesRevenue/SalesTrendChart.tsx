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
} from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import type { CustomTooltipProps } from "@/lib/types/chart";
import { useSalesTrends } from "@/hooks/useSalesTrends";
import { TrendingUp } from "lucide-react";
import ChartSkeleton from "@/components/ui/chartskeleton";
import {
  BAR_RADIUS,
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  PillSwitch,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

// Types
type ViewMode = "daily" | "weekly" | "monthly";

export interface SalesTrendsData {
  label: string;
  totalSales: number;
  totalRevenue: number;
}

const REVENUE_COLOR = CHART_PALETTE.blue;

// Sub-components

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
      rows={[
        {
          name: "Revenue",
          color: REVENUE_COLOR,
          value: formatCurrencySymbol(
            payload[0].value as number,
            currency.symbol,
            currency.locale,
          ),
        },
      ]}
    />
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

/** A message in the chart's place, the same height so the card does not jump. */
const ChartMessage = ({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) => (
  <div className="flex h-64 flex-col items-center justify-center text-center sm:h-72">
    <p className="text-sm" style={{ color: CHART_PALETTE.axis }}>
      {title}
    </p>
    {detail && (
      <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
        {detail}
      </p>
    )}
  </div>
);

// Chart

export default function SalesTrendChart() {
  const [view, setView] = useState<ViewMode>("weekly");
  const { currency } = useCurrency();
  const { data: rawData, isLoading, isError, error } = useSalesTrends(view);

  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  const ticks = niceTicks(
    0,
    rawData && rawData.length > 0
      ? Math.max(...rawData.map((d) => d.totalRevenue))
      : 0,
  );

  return (
    <ChartCard
      icon={TrendingUp}
      // #4D78CE, with its own shades: ~25% of it on white for the frame,
      // ~8% for the fill.
      iconColor="#4d78ce"
      iconBorder="#d3ddf3"
      iconBg="#f1f4fb"
      title="Sales Trends"
      info={{
        heading: "Reading this chart",
        // The windows come from useSalesTrends, not the page's date range.
        body: "Each bar is what you took in that day, week or month: daily shows the last 30 days, weekly about the last six months, monthly the last year. This card does not follow the date range at the top of the page. Hover a bar for the exact figure.",
      }}
      subtitle="Revenue over time – switch between daily, weekly, and monthly views"
      controls={
        <PillSwitch
          label="Sales trend view"
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
      }
    >
      {isLoading && <ChartSkeleton />}

      {isError && (
        <ChartMessage
          title="Failed to load sales data"
          detail={error?.message ?? "Please try again later"}
        />
      )}

      {!isLoading && !isError && (!rawData || rawData.length === 0) && (
        <ChartMessage title="No sales in this period yet" />
      )}

      {!isLoading && !isError && rawData && rawData.length > 0 && (
        <>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rawData}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                barCategoryGap="22%"
              >
                <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
                <XAxis
                  dataKey="label"
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
                  label={yAxisTitle("Revenue")}
                />
                <Tooltip
                  content={<CustomTooltip currency={currency} />}
                  cursor={{ fill: "rgba(60,64,67,0.04)" }}
                />
                <Bar
                  dataKey="totalRevenue"
                  name="Revenue"
                  fill={REVENUE_COLOR}
                  maxBarSize={56}
                  radius={BAR_RADIUS}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ChartLegend
            items={[{ label: "Revenue", color: REVENUE_COLOR, shape: "dot" }]}
          />
        </>
      )}
    </ChartCard>
  );
}
