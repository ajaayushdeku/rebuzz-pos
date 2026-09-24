"use client";

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
import { CustomTooltipProps, DataPoint } from "@/lib/types/chart";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "@/components/dashboardComponents/chartCard";
import { ChartColumnBig } from "lucide-react";

interface WeeklyRevenueChartProps {
  data: DataPoint[];
  peakDay: string;
}

const BAR_COLOR_DEFAULT = "#8ab4f8";
const BAR_COLOR_PEAK = CHART_PALETTE.blue;

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <ChartTooltipBox
        label={label}
        rows={[
          {
            name: "Revenue",
            color: CHART_PALETTE.blue,
            value: formatCurrencySymbol(
              payload[0].value as number,
              currency.symbol,
              currency.locale,
            ),
          },
        ]}
      />
    );
  }
  return null;
};

const WeeklyRevenueChart = ({ data, peakDay }: WeeklyRevenueChartProps) => {
  const CustomBar = (props: BarShapeProps) => {
    const barData = data[props.index ?? 0];

    const isPeak = barData?.day === peakDay;
    return (
      <Rectangle
        {...props}
        fill={isPeak ? BAR_COLOR_PEAK : BAR_COLOR_DEFAULT}
        radius={BAR_RADIUS}
      />
    );
  };

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const domainMax = Math.ceil(maxRevenue / 1000) * 1000 + 2000;

  const { currency } = useCurrency();
  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={ChartColumnBig}
      title="Daily Sales Trend"
      info={{
        heading: "Reading this chart",
        // The darker bar is the week's best day.
        body: "Revenue taken on each day of the current week. The darker bar is the week's busiest day — it does not follow the date filter at the top of the page.",
      }}
      subtitle="Revenue performance – current week"
    >
      <div className="h-56 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 0,
              left: 10,
              bottom: 0,
            }}
            barCategoryGap="15%"
          >
            <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              domain={[0, domainMax]}
              width={80}
              label={yAxisTitle("Revenue")}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ fill: CHART_PALETTE.hover }}
            />
            <Bar dataKey="revenue" shape={CustomBar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default WeeklyRevenueChart;
