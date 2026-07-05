"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { CampaignAnalysisData } from "@/lib/mockData/mockInsightData";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

interface CampaignAnalysisProps {
  data: CampaignAnalysisData;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }[];
  label?: string;
  currency: { symbol: string; locale: string };
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-40">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={`${entry.name ?? "tip"}-${idx}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">
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

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-violet-500" />
      <span className="text-xs font-semibold text-violet-600">Revenue</span>
    </div>
  </div>
);

export default function CampaignAnalysis({ data }: CampaignAnalysisProps) {
  const { currency } = useCurrency();

  const maxRevenue = Math.max(...data.data.map((d) => d.revenue), 1);
  const step = Math.ceil(maxRevenue / 4 / 1000) * 1000 || 1000;
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrencySymbol(value, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full h-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay />

      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Campaign Analysis
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Sales before, during and after the latest discount campaign
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={data.data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="campaignGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            ticks={yTicks}
            domain={[0, yMax]}
            width={50}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend content={<CustomLegend />} />

          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill="url(#campaignGradient)"
            dot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{
              r: 6,
              fill: "#8b5cf6",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
          ← Pre-campaign
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
          🎯 During (+{data.campaignGrowth}%)
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
          → Post-campaign
        </span>
      </div>
    </div>
  );
}
