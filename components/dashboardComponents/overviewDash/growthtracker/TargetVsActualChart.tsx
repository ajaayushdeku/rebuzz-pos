"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import SetTargetsModal from "./SetTargetsModal";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "@/components/dashboardComponents/chartCard";
import { fetchTargets } from "@/services/apiTarget.client";
import { SquarePen, Target } from "lucide-react";

/** The two series' colours, shared by the chart, legend and hover box. */
const ACTUAL_COLOR = CHART_PALETTE.blue;
const TARGET_COLOR = CHART_PALETTE.subtitle;

export interface TargetActualData {
  month: string;
  actual: number;
  target: number;
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ── Chart helpers ─────────────────────────────────────────────────────────

const getYAxisTicks = (data: TargetActualData[]): number[] => {
  const max = Math.max(...data.flatMap((d) => [d.actual, d.target]), 1);
  const step = Math.ceil(max / 4 / 1000) * 1000 || 1000;
  return [0, step, step * 2, step * 3, step * 4];
};

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const actual = payload.find((p) => p.dataKey === "actual");
  const target = payload.find((p) => p.dataKey === "target");
  const variance =
    actual && target
      ? (actual.value as number) - (target.value as number)
      : null;

  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: (entry.color as string) ?? ACTUAL_COLOR,
        value: formatCurrencySymbol(
          entry.value as number,
          currency.symbol,
          currency.locale,
        ),
      }))}
      footer={
        variance !== null ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: CHART_PALETTE.axis }}>
              Variance
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{
                color: variance >= 0 ? CHART_PALETTE.good : CHART_PALETTE.bad,
              }}
            >
              {variance >= 0 ? "+" : ""}
              {formatCurrencySymbol(variance, currency.symbol, currency.locale)}
            </span>
          </div>
        ) : undefined
      }
    />
  );
};

const CustomLegend = () => (
  <ChartLegend
    items={[
      { label: "Actual", color: ACTUAL_COLOR, shape: "dot" },
      { label: "Target", color: TARGET_COLOR, shape: "dashed" },
    ]}
  />
);

// ── Skeleton ──────────────────────────────────────────────────────────────

// const ChartSkeleton = () => (
//   <div className="animate-pulse space-y-3">
//     <div className="h-4 bg-gray-200 rounded w-1/3" />
//     <div className="h-3 bg-gray-200 rounded w-1/2" />
//     <div className="h-72 bg-gray-100 rounded-xl mt-4" />
//   </div>
// );

// ── Main chart ────────────────────────────────────────────────────────────

export interface TargetVsActualProps {
  data: TargetActualData[];
}

export default function TargetVsActualChart({ data }: TargetVsActualProps) {
  const { currency } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const year = new Date().getFullYear();

  // Saved targets come from the API; actuals come from the server-provided
  // `data`. We overlay the saved target onto each month (absent month → 0).
  const { data: saved, isLoading: isLoadingTargets } = useQuery({
    queryKey: ["target", year],
    queryFn: () => fetchTargets(year),
    staleTime: 60 * 1000,
  });

  const chartData = useMemo<TargetActualData[]>(() => {
    if (!saved) return data;
    const targetByMonth = new Map(
      saved.monthlyTargets.map((t) => [t.month, t.amount]),
    );
    return data.map((row) => {
      const monthNum = MONTHS_SHORT.indexOf(row.month) + 1;
      return { ...row, target: targetByMonth.get(monthNum) ?? 0 };
    });
  }, [data, saved]);

  const isEmpty = chartData.every((d) => d.actual === 0 && d.target === 0);
  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);
  const yTicks = getYAxisTicks(chartData);
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  // if (isLoadingTargets) {
  //   return (
  //     <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full">
  //       <ChartSkeleton />
  //     </div>
  //   );
  // }

  return (
    <>
      <ChartCard
        icon={Target}
        title="Target vs Actual Revenue"
        info={{
          heading: "Reading this chart",
          // Targets are entered here, actuals come from paid bills.
          body: "Each month's revenue against the target you set for it. The filled line is what you took, the dashed line is the target — a month with no target set reads as zero. Use Set Targets to enter them.",
        }}
        subtitle="Monthly performance against set targets"
        controls={
          <button
            onClick={() => setModalOpen(true)}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            <SquarePen size={11} />
            Set Targets
          </button>
        }
      >
        {isEmpty && <SampleDataBadge />}

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACTUAL_COLOR} stopOpacity={0.2} />
                <stop
                  offset="100%"
                  stopColor={ACTUAL_COLOR}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              dy={8}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              ticks={yTicks}
              domain={[0, yMax]}
              width={80}
              label={yAxisTitle("Revenue")}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: CHART_PALETTE.control, strokeWidth: 1 }}
            />
            <Legend content={<CustomLegend />} />

            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={ACTUAL_COLOR}
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              dot={{ r: 4, fill: ACTUAL_COLOR, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: ACTUAL_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke={TARGET_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{
                r: 4,
                fill: TARGET_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <SetTargetsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        year={year}
      />
    </>
  );
}
