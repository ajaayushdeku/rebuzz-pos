"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import {
  mockMarginTrendData,
  TARGET_MARGIN,
} from "@/lib/mockData/mock-profitcost-advanced";
import type { MarginTrendPoint } from "@/lib/mockData/mock-profitcost-advanced";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber } from "@/utils/helper";

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtPct(v: number) {
  return `${v}%`;
}

// Merge historical + projected into a flat recharts-friendly array
function buildChartData(data: MarginTrendPoint[]) {
  return data.map((d) => ({
    month: d.month,
    netProfit: d.netProfit ?? null,
    projectedProfit: d.projectedProfit ?? null,
    marginPct: d.marginPct ?? null,
    forecastMarginMin: d.forecastMarginMin ?? null,
    forecastMarginMax: d.forecastMarginMax ?? null,
    isProjected: d.isProjected ?? false,
  }));
}

// ── Custom tooltip ────────────────────────────────────────────────────────

type TooltipEntry = {
  name?: string;
  value?: number | string | null;
  color?: string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency: { symbol: string };
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map(
        (entry: TooltipEntry, i: number) =>
          entry.value != null && (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-500 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-gray-800">
                {entry.name === "Margin %" || entry.name === "forecastMarginMax"
                  ? `${entry.value}%`
                  : `${currency.symbol} ${formatCompactNumber(Number(entry.value))}`}
              </span>
            </div>
          ),
      )}
    </div>
  );
};

// ── Custom legend ─────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: "Margin %", color: "#10b981", dashed: false, dot: true },
  {
    label: "Net Profit",
    color: "#3b82f6",
    dashed: false,
    dot: false,
    bar: true,
  },
  {
    label: "Projected Profit",
    color: "#94a3b8",
    dashed: false,
    dot: false,
    bar: true,
  },
  { label: "Target Margin", color: "#f59e0b", dashed: true, dot: true },
  { label: "forecastMarginMax", color: "#34d399", dashed: false, dot: true },
];

const CustomLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-3">
    {LEGEND_ITEMS.map(({ label, color, dashed, dot, bar }) => (
      <div key={label} className="flex items-center gap-1.5">
        {bar ? (
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
          />
        ) : dashed ? (
          <svg width="18" height="8">
            <line
              x1="0"
              y1="4"
              x2="18"
              y2="4"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            {dot && <circle cx="9" cy="4" r="2.5" fill={color} />}
          </svg>
        ) : (
          <svg width="18" height="8">
            <line x1="0" y1="4" x2="18" y2="4" stroke={color} strokeWidth="2" />
            {dot && (
              <circle
                cx="9"
                cy="4"
                r="2.5"
                fill="white"
                stroke={color}
                strokeWidth="1.5"
              />
            )}
          </svg>
        )}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    ))}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────

export default function MarginProfitForecastChart() {
  const { currency } = useCurrency();
  const data = buildChartData(mockMarginTrendData);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Margin Profit Forecast Chart" />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Margin & Profit Trend with Forecast
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Historical net profit and margin % with 3-month projection
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 50, left: 10, bottom: 10 }}
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            dy={8}
          />

          {/* Left Y axis — $ profit */}
          <YAxis
            yAxisId="profit"
            orientation="left"
            tickFormatter={(v) =>
              `${currency.symbol} ${formatCompactNumber(v)}`
            }
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            ticks={[0, 20000, 40000, 60000, 80000]}
            width={45}
          />

          {/* Right Y axis — margin % */}
          <YAxis
            yAxisId="margin"
            orientation="right"
            tickFormatter={fmtPct}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            domain={[50, 70]}
            ticks={[50, 55, 60, 65, 70]}
            width={38}
          />

          <Tooltip content={<CustomTooltip currency={currency} />} />

          {/* Target margin dashed reference line */}
          <ReferenceLine
            yAxisId="margin"
            y={TARGET_MARGIN}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            strokeWidth={2}
          />

          {/* Historical net profit bars */}
          <Bar
            yAxisId="profit"
            dataKey="netProfit"
            name="Net Profit"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />

          {/* Projected profit bars */}
          <Bar
            yAxisId="profit"
            dataKey="projectedProfit"
            name="Projected Profit"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />

          {/* Forecast confidence band */}
          <Area
            yAxisId="margin"
            dataKey="forecastMarginMax"
            stroke="none"
            fill="#d1fae5"
            fillOpacity={0.6}
            name="forecastMarginMax"
            dot={false}
            activeDot={false}
          />

          {/* Margin % line */}
          <Line
            yAxisId="margin"
            type="monotone"
            dataKey="marginPct"
            stroke="#10b981"
            strokeWidth={2.5}
            name="Margin %"
            dot={{ r: 4, fill: "white", stroke: "#10b981", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            connectNulls
          />

          <Legend content={<CustomLegend />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
