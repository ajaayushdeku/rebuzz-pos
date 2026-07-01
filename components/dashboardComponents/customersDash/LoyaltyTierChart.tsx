"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { mockTierData } from "@/lib/mockData/mock-customer-data";

export interface TierData {
  tier: string;
  members: number;
}
export interface TierDataProps {
  data: TierData[];
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "#eb841e",
  Silver: "#cdcdcd",
  Gold: "#f7dd46",
  Platinum: "#936eff",
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const tierName = (label as string) ?? "";
    const color = TIER_COLORS[tierName] ?? "#60a5fa";
    return (
      <div className="flex flex-row gap-2 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: color as string,
            }}
          />
          <span className="text-xs text-gray-600 capitalize">{label}</span>
        </div>
        <span className={`text-xs font-bold text-gray-800 `} style={{ color }}>
          {(payload[0].value as number).toLocaleString()} members
        </span>
      </div>
    );
  }
  return null;
};

// Rounded right-side corners only for horizontal bars with tier-specific color
const CustomBar = (props: BarShapeProps) => {
  const tierName = props.payload?.tier ?? "";
  const color = TIER_COLORS[tierName] ?? "#60a5fa";
  return <Rectangle {...props} radius={[0, 6, 6, 0]} fill={color} />;
};

export default function LoyaltyTierChart({ data }: TierDataProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = data;

  // Dynamic X-axis based on actual data
  const maxMembers = Math.max(...displayData.map((d) => d.members), 1);
  const step = Math.ceil(maxMembers) || 10;
  const xTicks = [0, step, step * 2, step * 3, step * 4];
  const xDomain = xTicks[xTicks.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full min-w-0">
      {isEmpty && <SampleDataBadge />}
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Loyalty Tier Breakdown
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Members by loyalty status
        </p>
      </div>

      {/* Chart */}
      <div className="h-44 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{
              top: 0,
              right: 40,
              left: 10,
              bottom: 0,
            }}
            barCategoryGap="30%"
          >
            <CartesianGrid horizontal={false} stroke="#f3f4f6" />

            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              ticks={xTicks}
              domain={[0, xDomain]}
            />

            <YAxis
              type="category"
              dataKey="tier"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 13,
              }}
              width={52}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: "rgba(96,165,250,0.05)",
              }}
            />

            <Bar dataKey="members" shape={CustomBar}>
              <LabelList
                dataKey="members"
                position="right"
                style={{
                  fill: "#6b7280",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
