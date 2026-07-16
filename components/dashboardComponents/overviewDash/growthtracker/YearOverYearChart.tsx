"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";

import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { mockYearOverYearData } from "@/lib/mockData/mock-growthtrackerdata";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
// Types

export interface YoYData {
  month: string;
  lastYear: number;
  thisYear: number;
}

// Helpers

const getYAxisTicks = (data: YoYData[]): number[] => {
  const max = Math.max(...data.flatMap((d) => [d.lastYear, d.thisYear]), 1);
  const rawStep = max / 4;
  // Round step up to nice human-readable numbers
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep) || 0));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  return [0, step, step * 2, step * 3, step * 4];
};

// Sub-components

const LastYearBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#e2e8f0" />
);

const ThisYearBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#60a5fa" />
);

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {[
      {
        label: "Last Year",
        color: "#e2e8f0",
        textColor: "#9ca3af",
      },
      {
        label: "This Year",
        color: "#60a5fa",
        textColor: "#60a5fa",
      },
    ].map(({ label, color, textColor }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />

        <span className="text-xs font-semibold" style={{ color: textColor }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const lastYear = payload.find((p) => p.dataKey === "lastYear");
  const thisYear = payload.find((p) => p.dataKey === "thisYear");
  const lastVal = (lastYear?.value as number) ?? 0;
  const thisVal = (thisYear?.value as number) ?? 0;

  // Compute YoY growth percentage
  // When last year was $0 and this year has revenue → show +100% growth
  // When both are $0 → show 0%
  let growth: string | null = null;
  if (lastVal === 0 && thisVal === 0) {
    growth = "0.0";
  } else if (lastVal === 0 && thisVal > 0) {
    growth = "100.0";
  } else if (lastVal === 0 && thisVal < 0) {
    growth = "-100.0";
  } else {
    const pct = ((thisVal - lastVal) / lastVal) * 100;
    if (isFinite(pct)) {
      growth = pct.toFixed(1);
    } else {
      growth = "0.0";
    }
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-40">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>

      {payload.map((entry, idx) => (
        <div
          key={`${entry.name ?? "tooltip"}-${idx}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color as string,
              }}
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

      {growth !== null && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
          <span className="text-xs text-gray-400">YoY Growth</span>

          <span
            className={`text-xs font-bold ${Number(growth) >= 0 ? "text-green-500" : "text-red-400"}`}
          >
            {Number(growth) >= 0 ? "+" : ""}
            {growth}%
          </span>
        </div>
      )}
    </div>
  );
};

// Chart
export interface YearOverYearProps {
  data: YoYData[];
}
export default function YearOverYearChart({ data }: YearOverYearProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockYearOverYearData : data;

  const { currency } = useCurrency();

  const formatYAxis = (value: number): string =>
    `${currency.symbol} ${formatCompactNumber(value)}`;

  const yTicks = getYAxisTicks(displayData);
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm  p-5 w-full">
      {isEmpty && <SampleDataBadge />}

      {/* Header */}
      <div className="mb-2">
        <h2 className="text-sm font-bold text-gray-900">
          Year-over-Year Revenue
        </h2>

        <p className="text-xs text-gray-400 mt-0.5">
          This year vs last year — monthly comparison
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={displayData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
          }}
          barCategoryGap="25%"
          barGap={3}
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#9ca3af",
              fontSize: 12,
            }}
            dy={8}
          />

          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#9ca3af",
              fontSize: 12,
            }}
            ticks={yTicks}
            domain={[0, yMax]}
            width={50}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />

          <Legend content={<CustomLegend />} />

          <Bar dataKey="lastYear" name="Last Year" shape={LastYearBar} />

          <Bar dataKey="thisYear" name="This Year" shape={ThisYearBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
