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
import { Award } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";

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
  total: number;
}

/**
 * Metallic-but-legible. The literal metal colours for silver (#cdcdcd) and
 * gold (#f7dd46) were too pale to read as filled bars on a white card, so both
 * are pulled a few steps darker while keeping the association.
 */
const TIER_COLORS: Record<string, string> = {
  Bronze: "#d97706",
  Silver: "#94a3b8",
  Gold: "#eab308",
  Platinum: "#936eff",
};

const FALLBACK_COLOR = "#60a5fa";

/**
 * A round step whose multiples cover `max` in roughly four intervals.
 *
 * The previous axis used `step = maxMembers` and then plotted ticks at
 * 0…4×step, so the domain was always four times the largest value and the
 * biggest bar could never fill more than a quarter of the plot.
 */
function niceStep(max: number): number {
  const raw = Math.max(max, 1) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(1, Math.round(nice * magnitude));
}

const CustomTooltip = ({
  active,
  payload,
  label,
  total,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const tierName = (label as string) ?? "";
    const color = TIER_COLORS[tierName] ?? FALLBACK_COLOR;
    const members = payload[0].value as number;
    const share = total > 0 ? (members / total) * 100 : 0;

    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs capitalize text-gray-600">{label}</span>
        </div>
        <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">
          {members.toLocaleString()}
          <span className="ml-1 text-xs font-medium text-gray-500">
            {members === 1 ? "member" : "members"}
          </span>
          <span className="ml-1.5 text-xs font-medium text-gray-400">
            {share.toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Rounded right-side corners only for horizontal bars with tier-specific color
const CustomBar = (props: BarShapeProps) => {
  const tierName = props.payload?.tier ?? "";
  const color = TIER_COLORS[tierName] ?? FALLBACK_COLOR;
  return <Rectangle {...props} radius={[0, 6, 6, 0]} fill={color} />;
};

export default function LoyaltyTierChart({ data }: TierDataProps) {
  // Empty covers "no tiers returned" and "tiers returned but nobody in them" —
  // both render an unreadable, all-zero chart.
  const isEmpty =
    !data || data.length === 0 || data.every((d) => d.members === 0);
  const displayData = data ?? [];

  const totalMembers = displayData.reduce(
    (sum, d) => sum + (d.members ?? 0),
    0,
  );

  // Dynamic X-axis based on actual data
  const maxMembers = Math.max(...displayData.map((d) => d.members), 1);
  const step = niceStep(maxMembers);
  const xDomain = Math.ceil(maxMembers / step) * step;
  const xTicks = Array.from(
    { length: Math.round(xDomain / step) + 1 },
    (_, i) => i * step,
  );

  return (
    <div className="bg-surface-card border-surface-border w-full min-w-0 rounded-2xl border p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Award size={15} className="text-amber-600" />
          </div>
          <ComponentHeader
            title="Loyalty Tier Breakdown"
            subHeader="Members by loyalty status"
          />
        </div>

        {/* Enrolled total — the chart shows the split but never the size of
            the programme it is splitting. */}
        {!isEmpty && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Enrolled
            </span>
            <p className="mt-0.5 text-base font-bold leading-tight tabular-nums text-gray-900">
              {totalMembers.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      {isEmpty ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center sm:h-56 md:h-64">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Award size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No loyalty tier data
          </p>
          <p className="max-w-[15rem] text-xs text-gray-400">
            Tier breakdown appears once customers are enrolled in the loyalty
            program.
          </p>
        </div>
      ) : (
        <div className="mt-4 h-44 mt-10 sm:h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{
                top: 0,
                right: 44,
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
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="tier"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#6b7280",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                width={62}
              />

              <Tooltip
                content={<CustomTooltip total={totalMembers} />}
                cursor={{
                  fill: "rgba(96,165,250,0.05)",
                }}
              />

              <Bar dataKey="members" shape={CustomBar}>
                <LabelList
                  dataKey="members"
                  position="right"
                  style={{
                    fill: "#374151",
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
