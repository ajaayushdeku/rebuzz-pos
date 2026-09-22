"use client";

import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import type { CampaignAnalysisData } from "@/lib/mockData/mockInsightData";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { Megaphone } from "lucide-react";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  niceTicks,
} from "../chartCard";

interface CampaignAnalysisProps {
  data: CampaignAnalysisData;
}

const REVENUE_COLOR = CHART_PALETTE.blue;

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
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry, idx) => ({
        name: entry.name ?? `Series ${idx + 1}`,
        color: REVENUE_COLOR,
        value: formatCurrencySymbol(
          entry.value as number,
          currency.symbol,
          currency.locale,
        ),
      }))}
    />
  );
};

/** A flat pill naming a phase of the campaign; the live phase is tinted. */
const PhasePill = ({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) => (
  <span
    className={`rounded-full border px-2.5 py-1 text-[11px] ${active ? "bg-blue-50/60" : "bg-white"}`}
    style={{
      borderColor: active ? "#d2e3fc" : CHART_PALETTE.control,
      color: active ? CHART_PALETTE.blue : CHART_PALETTE.axis,
    }}
  >
    {children}
  </span>
);

export default function CampaignAnalysis({ data }: CampaignAnalysisProps) {
  const { currency } = useCurrency();

  const ticks = niceTicks(0, Math.max(...data.data.map((d) => d.revenue), 1));

  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={Megaphone}
      title="Campaign Analysis"
      subtitle="Sales before, during and after the latest discount campaign"
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card's root (the only positioned
          ancestor), so its inset-0 fills the whole card, header included. */}
      <LockDimFeactureOverlay component_name="Campaign Analysis" />

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data.data}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="campaignGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={REVENUE_COLOR}
                  stopOpacity={0.16}
                />
                <stop
                  offset="100%"
                  stopColor={REVENUE_COLOR}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

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
              width={56}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: CHART_PALETTE.control }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={REVENUE_COLOR}
              strokeWidth={2}
              fill="url(#campaignGradient)"
              dot={{
                r: 3,
                fill: REVENUE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: REVENUE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend
        items={[{ label: "Revenue", color: REVENUE_COLOR, shape: "dot" }]}
      />

      {/* Campaign phases */}
      <div className="mt-4 flex flex-wrap gap-2">
        <PhasePill>← Pre-campaign</PhasePill>
        <PhasePill active>During (+{data.campaignGrowth}%)</PhasePill>
        <PhasePill>→ Post-campaign</PhasePill>
      </div>
    </ChartCard>
  );
}
