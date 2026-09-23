"use client";
import { CHART_PALETTE, ChartCard, ChartTooltipBox } from "../chartCard";
import { ChartPie } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Raw shape from backend — no color
export interface SegmentData {
  name: string;
  value: number;
}

// Internal shape with color assigned client-side
interface SegmentDataWithColor extends SegmentData {
  color: string;
  share: number;
}

interface CustomerSegmentationChartProps {
  data: SegmentData[];
}

/**
 * Colour is bound to the segment name, not to its position in the array.
 * getCustomerSegmentation returns Active, Inactive, New, New & Active — while
 * the old positional palette was written for New, Active, Inactive, … so New
 * customers were drawn in red and Inactive ones in amber. Keying by name means
 * a reorder on the server can't silently swap the meanings again.
 */
const SEGMENT_COLORS: Record<string, string> = {
  Active: "#10B981", // emerald — buying
  "New & Active": "#3b96ff", // blue — new and already buying
  New: "#F59E0B", // amber — signed up, not yet buying
  Inactive: "#EF4444", // red — lapsed
};

/** Fallback for a segment name the map doesn't know. */
const FALLBACK_COLORS = ["#8B5CF6", "#06B6D4", "#F97316", "#64748B"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  if (active && payload?.length) {
    const entry = payload[0].payload as SegmentDataWithColor;
    return (
      <ChartTooltipBox
        label={entry.name}
        rows={[
          {
            name: "Customers",
            color: entry.color,
            value: entry.value.toLocaleString(),
          },
          {
            name: "Share",
            color: entry.color,
            value: `${entry.share.toFixed(1)}%`,
          },
        ]}
      />
    );
  }
  return null;
};

export default function CustomerSegmentationChart({
  data,
}: CustomerSegmentationChartProps) {
  // An all-zero response draws no slices at all, so treat it as empty too.
  const isEmpty =
    !data || data.length === 0 || data.every((d) => d.value === 0);

  const total = (data ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0);

  const coloredData: SegmentDataWithColor[] = (data ?? []).map((entry, i) => ({
    ...entry,
    color:
      SEGMENT_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    share: total > 0 ? (entry.value / total) * 100 : 0,
  }));

  return (
    <ChartCard
      icon={ChartPie}
      // Sky, as before: Tailwind's sky-600 / sky-200 / sky-50.
      iconColor="#0284c7"
      iconBorder="#bae6fd"
      iconBg="#f0f9ff"
      title="Customer Segmentation"
      info={{
        heading: "Reading this chart",
        // Its own 15-day window, independent of the page's range.
        body: "Customers grouped by how recently they bought, over the last 15 days — this card has its own window and does not follow the date range at the top of the page. The figure in the middle is every customer counted across the segments.",
      }}
      subtitle="Customer activity distribution over the last 15 days"
      className="h-full min-w-0"
    >
      {/* Pie Chart + Legend */}
      {isEmpty ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center sm:h-60">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ChartPie size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No customer activity
          </p>
          <p
            className="max-w-[15rem] text-xs"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            Segments appear once customers place orders in the last 15 days.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col">
          {/* The donut hole was empty; the total belongs there, where the eye
              lands first. The overlay ignores pointer events so slice hover
              and the tooltip still work through it. */}
          <div className="relative h-40 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coloredData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {coloredData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p
                className="text-xl font-semibold leading-none tracking-tight tabular-nums sm:text-2xl"
                style={{ color: CHART_PALETTE.title }}
              >
                {total.toLocaleString()}
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Customers
              </p>
            </div>
          </div>

          {/* Legend — aligned rows rather than fixed-width centred blocks, so
              the counts line up in a column and long names can't push the
              value out of the card. */}
          <div
            className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t pt-3 sm:grid-cols-2"
            style={{ borderColor: CHART_PALETTE.grid }}
          >
            {coloredData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-[13px]"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {entry.name}
                </span>
                <span className="flex flex-row items-center">
                  {" "}
                  <span
                    className="shrink-0 text-[13px] font-medium tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {entry.value.toLocaleString()}
                  </span>
                  <span
                    className="w-10 shrink-0 text-right text-[11px] tabular-nums"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    [ {entry.share.toFixed(0)}% ]
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
