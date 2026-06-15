"use client";

import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency, formatCurrencySymbol } from "@/utils/helper";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface HourlyData {
  hour: string;
  revenue: number;
}

interface HourlyDataProps {
  data: HourlyData[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="font-bold text-sm text-violet-600">
          {/* {formatCurrency(payload[0].value as number, currency)} */}
          {formatCurrencySymbol(
            payload[0].value as number,
            currency.symbol,
            currency.locale,
          )}
        </p>
      </div>
    );
  }
  return null;
};

const HourlySalesTrend = ({ data }: HourlyDataProps) => {
  const { currency } = useCurrency();

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrency(value, currency);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const domainMax =
    maxRevenue === 0 ? 500 : Math.ceil(maxRevenue / 100) * 100 + 100;
  const tickCount = 5;
  const tickStep = Math.ceil(domainMax / tickCount / 100) * 100;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6 w-full mt-4">
      {/* HEADER */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Hourly Sales Trend
        </h2>

        <p className="text-xs text-gray-400 mt-0.5">
          Revenue throughput across all operating hours today
        </p>
      </div>

      {/* CHART */}
      <div className="h-56 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f3f4f6" />

            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              dy={8}
            />

            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              ticks={ticks}
              domain={[0, domainMax]}
              width={55}
            />

            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{
                stroke: "#7c3aed",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{
                r: 4,
                fill: "#7c3aed",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#7c3aed",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlySalesTrend;
