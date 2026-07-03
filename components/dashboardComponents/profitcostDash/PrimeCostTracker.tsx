"use client";

import { primeCostMock } from "@/lib/mockData/mock-primecost";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

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
  const value = payload[0].value;

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: "#3b82f6" }}
          />
          <span className="text-xs text-gray-600">Prime Cost</span>
        </div>
        <span className="text-xs font-bold text-gray-800">
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
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

  const yTicks = [50, 57, 64, 71, 75];
  const yMax = 75;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Prime Cost Tracker
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          COGS + Labor as a % of Revenue
        </p>
      </div>

      {/* Current Prime Cost */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-1">Current Prime Cost</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-green-600">
            {avgPrimeCost.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">Target: 55%-65%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="pcColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f3f4f6" />

            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              ticks={yTicks}
              domain={[50, yMax]}
              width={52}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="primeCost"
              stroke="#3b82f6"
              fill="url(#pcColor)"
              strokeWidth={2.5}
            />

            <Line
              type="monotone"
              dataKey="primeCost"
              stroke="#1d4ed8"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#3b82f6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={8}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
