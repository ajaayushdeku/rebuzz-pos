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
import { formatCurrencySymbol } from "@/utils/helper";

interface WeeklyRevenueChartProps {
  data: DataPoint[];
  peakDay: string;
}

const BAR_COLOR_DEFAULT = "#60a5fa";
const BAR_COLOR_PEAK = "#2563eb";

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <div className="flex items-center justify-between gap-4">
          {" "}
          <span className="text-xs text-gray-500 items-left">Revenue</span>
          <span className="text-xs font-bold text-blue-600">
            {/* {formatCurrency(payload[0].value as number, currency)} */}
            {formatCurrencySymbol(
              payload[0].value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      </div>
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
        radius={[4, 4, 0, 0]}
      />
    );
  };

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const domainMax = Math.ceil(maxRevenue / 1000) * 1000 + 2000;

  const { currency } = useCurrency();
  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol} ${value / 1000}k`
      : formatCurrencySymbol(value, currency.symbol, currency.locale);

  return (
    <div className="w-full bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Daily Sales Trend
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Revenue performance – current week
        </p>
      </div>
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
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 13,
              }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              domain={[0, domainMax]}
              width={42}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{
                fill: "rgba(59,130,246,0.05)",
              }}
            />
            <Bar dataKey="revenue" shape={CustomBar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyRevenueChart;
