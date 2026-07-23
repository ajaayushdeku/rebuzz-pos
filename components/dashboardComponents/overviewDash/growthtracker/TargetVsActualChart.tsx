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
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import { fetchTargets } from "@/services/apiTarget.client";

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
            {/* {formatCurrency(entry.value as number, currency)} */}
            {formatCurrencySymbol(
              entry.value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      ))}
      {variance !== null && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
          <span className="text-xs text-gray-400">Variance</span>
          <span
            className={`text-xs font-bold ${variance >= 0 ? "text-green-500" : "text-red-400"}`}
          >
            {variance >= 0 ? "+" : ""}
            {/* {formatCurrency(variance, currency)} */}
            {formatCurrencySymbol(variance, currency.symbol, currency.locale)}
          </span>
        </div>
      )}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-blue-400" />
      <span className="text-xs font-semibold text-blue-500">Actual</span>
    </div>
    <div className="flex items-center gap-2">
      <svg width="20" height="8">
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
      <span className="text-xs font-semibold text-gray-400">Target</span>
    </div>
  </div>
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
    `${currency.symbol} ${formatCompactNumber(value)}`;
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
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5  w-full">
        {isEmpty && <SampleDataBadge />}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <ComponentHeader
              title="Target vs Actual Revenue"
              subHeader="Monthly performance against set targets"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shrink-0"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Set Targets
          </button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
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
              dataKey="actual"
              name="Actual"
              stroke="#60a5fa"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              dot={{ r: 4, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#60a5fa",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#9ca3af",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <SetTargetsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        year={year}
      />
    </>
  );
}
