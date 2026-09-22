"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { formatCompactCurrency } from "@/utils/helper";
import { ChartSpline } from "lucide-react";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";

// ── Colours ───────────────────────────────────────────────────────────────

const COLORS = {
  profit: CHART_PALETTE.darkBlue,
  projected: "#bdc1c6",
  margin: "#34a853",
  band: "#ceead6",
  target: "#f29900",
} as const;

/** The series' display names, shared by the chart, tooltip and legend. */
const NAMES = {
  profit: "Net Profit",
  projected: "Projected Profit",
  margin: "Margin %",
  band: "Forecast range",
  target: "Target Margin",
} as const;

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
  currency: { symbol: string; locale: string };
}) => {
  if (!active || !payload?.length) return null;
  const isPercent = (name?: string) =>
    name === NAMES.margin || name === NAMES.band;
  return (
    <ChartTooltipBox
      label={label}
      rows={payload
        .filter((entry) => entry.value != null)
        .map((entry) => ({
          name: String(entry.name),
          color: String(entry.color),
          value: isPercent(entry.name)
            ? `${entry.value}%`
            : formatCompactCurrency(
                Number(entry.value),
                currency.symbol,
                currency.locale,
              ),
        }))}
    />
  );
};

// ── Main component ────────────────────────────────────────────────────────

export default function MarginProfitForecastChart() {
  const { currency } = useCurrency();
  const data = buildChartData(mockMarginTrendData);

  return (
    <ChartCard
      icon={ChartSpline}
      // Violet, as before: Tailwind's violet-600 / violet-200 / violet-50.
      iconColor="#7c3aed"
      iconBorder="#ddd6fe"
      iconBg="#f5f3ff"
      title="Margin & Profit Trend with Forecast"
      subtitle="Historical net profit and margin % with 3-month projection"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the chart. */}
      <LockDimFeactureOverlay component_name="Margin Profit Forecast Chart" />

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={{ stroke: CHART_PALETTE.control }}
            tickSize={6}
            tick={AXIS_TICK}
          />

          {/* Left Y axis — money */}
          <YAxis
            yAxisId="profit"
            orientation="left"
            tickFormatter={(v) =>
              formatCompactCurrency(v, currency.symbol, currency.locale)
            }
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            ticks={[0, 20000, 40000, 60000, 80000]}
            width={72}
            label={yAxisTitle("Net profit")}
          />

          {/* Right Y axis — margin % */}
          <YAxis
            yAxisId="margin"
            orientation="right"
            tickFormatter={fmtPct}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            domain={[50, 70]}
            ticks={[50, 55, 60, 65, 70]}
            width={56}
            label={{
              value: "Margin",
              angle: 90,
              position: "insideRight",
              offset: 0,
              style: {
                fill: CHART_PALETTE.axis,
                fontSize: 12,
                textAnchor: "middle",
              },
            }}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: "rgba(60,64,67,0.04)" }}
          />

          {/* Target margin dashed reference line */}
          <ReferenceLine
            yAxisId="margin"
            y={TARGET_MARGIN}
            stroke={COLORS.target}
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />

          {/* Historical net profit bars */}
          <Bar
            yAxisId="profit"
            dataKey="netProfit"
            name={NAMES.profit}
            fill={COLORS.profit}
            radius={BAR_RADIUS}
            barSize={28}
          />

          {/* Projected profit bars */}
          <Bar
            yAxisId="profit"
            dataKey="projectedProfit"
            name={NAMES.projected}
            fill={COLORS.projected}
            radius={BAR_RADIUS}
            barSize={28}
          />

          {/* Forecast confidence band */}
          <Area
            yAxisId="margin"
            dataKey="forecastMarginMax"
            stroke="none"
            fill={COLORS.band}
            fillOpacity={0.7}
            name={NAMES.band}
            dot={false}
            activeDot={false}
          />

          {/* Margin % line */}
          <Line
            yAxisId="margin"
            type="monotone"
            dataKey="marginPct"
            stroke={COLORS.margin}
            strokeWidth={2}
            name={NAMES.margin}
            dot={{
              r: 3,
              fill: "#fff",
              stroke: COLORS.margin,
              strokeWidth: 1.5,
            }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      <ChartLegend
        items={[
          { label: NAMES.profit, color: COLORS.profit, shape: "square" },
          { label: NAMES.projected, color: COLORS.projected, shape: "square" },
          { label: NAMES.margin, color: COLORS.margin, shape: "line" },
          { label: NAMES.band, color: COLORS.band, shape: "square" },
          { label: NAMES.target, color: COLORS.target, shape: "dashed" },
        ]}
      />
    </ChartCard>
  );
}
