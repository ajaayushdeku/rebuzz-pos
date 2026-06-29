"use client";

import { useState, useMemo } from "react";
import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { HOUR_RANGES } from "@/utils/formatHourReportToday";

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

export default function HourlySalesChart({ data }: HourlyDataProps) {
  const { currency } = useCurrency();
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const filteredData = useMemo(() => {
    if (!selectedRange) return data;
    const rangeLabel = (h: number) => `${h.toString().padStart(2, "0")}:00`;
    return data.filter((d) => {
      const hour = parseInt(d.hour.split(":")[0], 10);
      return hour >= selectedRange.start && hour <= selectedRange.end;
    });
  }, [data, selectedRange]);

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol} ${value / 1000}k`
      : formatCurrencySymbol(value, currency.symbol, currency.locale);

  const maxRevenue = Math.max(...filteredData.map((d) => d.revenue), 0);
  const domainMax =
    maxRevenue === 0 ? 500 : Math.ceil(maxRevenue / 100) * 100 + 100;
  const tickCount = 5;
  const tickStep = Math.ceil(domainMax / tickCount / 100) * 100;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6 w-full mt-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Hourly Sales Trend
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Revenue throughput across all operating hours today
          </p>
        </div>

        {/* Hour Range Filter */}
        <div className="flex items-center gap-2">
          <select
            value={
              selectedRange
                ? `${selectedRange.start}-${selectedRange.end}`
                : "all"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all") {
                setSelectedRange(null);
              } else {
                const [start, end] = val.split("-").map(Number);
                setSelectedRange({ start, end });
              }
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="all">All Day (00:00 – 23:59)</option>
            {HOUR_RANGES.map((range) => (
              <option key={range.label} value={`${range.start}-${range.end}`}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CHART with horizontal scroll */}
      <div className="overflow-x-auto pb-2">
        <div style={{ minWidth: Math.max(filteredData.length * 60, 600) }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={filteredData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
                  fontSize: 11,
                }}
                dy={8}
                interval="preserveStartEnd"
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
    </div>
  );
}
