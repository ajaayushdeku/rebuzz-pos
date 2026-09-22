"use client";

import { Gauge } from "lucide-react";
import { primeCostMock } from "@/lib/mockData/mock-primecost";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";

const LINE_COLOR = CHART_PALETTE.darkBlue;

function calculatePrimeCost(cogs: number, labor: number, revenue: number) {
  return revenue > 0 ? ((cogs + labor) / revenue) * 100 : 0;
}

interface PrimeCostData {
  month: string;
  primeCost: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox
      label={label}
      rows={[
        {
          name: "Prime Cost",
          color: LINE_COLOR,
          value: `${payload[0].value.toFixed(1)}%`,
        },
      ]}
    />
  );
};

export default function PrimeCostTracker() {
  const data: PrimeCostData[] = primeCostMock.map((d) => ({
    month: d.month,
    primeCost: calculatePrimeCost(d.cogs, d.labor, d.revenue),
  }));

  const avgPrimeCost =
    data.reduce((sum, d) => sum + d.primeCost, 0) / data.length;

  const formatYAxis = (value: number): string => {
    return `${value.toFixed(0)}%`;
  };

  const yTicks = [15, 35, 55, 75];
  const yMax = 75;

  return (
    <ChartCard
      icon={Gauge}
      // Amber, as before: Tailwind's amber-600 / amber-200 / amber-50.
      iconColor="#d97706"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Prime Cost Tracker"
      subtitle="COGS + Labor as a % of Revenue"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the chart. */}
      <LockDimFeactureOverlay component_name="Prime Cost Tracker" />

      {/* Current Prime Cost */}
      <div className="mb-2">
        <p className="mb-1 text-[11px]" style={{ color: CHART_PALETTE.axis }}>
          Current Prime Cost
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold tracking-tight text-green-600">
            {avgPrimeCost.toFixed(1)}%
          </p>
          <p className="text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Target: 55%-65%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pcColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.18} />
                <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

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
              ticks={yTicks}
              domain={[0, yMax]}
              width={64}
              label={yAxisTitle("Prime cost")}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: CHART_PALETTE.control, strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="primeCost"
              stroke={LINE_COLOR}
              fill="url(#pcColor)"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="primeCost"
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: LINE_COLOR, stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{
                r: 5,
                fill: LINE_COLOR,
                stroke: "#fff",
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
