"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { mockWaterfallData } from "@/lib/mockData/mock-profitcost-advanced";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

function fmtK(v: number) {
  return `$${(v / 1000).toFixed(0)}k`;
}

const BAR_COLORS: Record<string, string> = {
  start: "#64748b",
  deduct: "#f43f5e",
  result: "#22c55e",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-500">
        Running total:{" "}
        <span className="font-bold text-gray-800">{fmtK(d.value)}</span>
      </p>
      {d.deduction > 0 && (
        <p className="text-red-500">
          Deduction: <span className="font-bold">−{fmtK(d.deduction)}</span>
        </p>
      )}
    </div>
  );
};

export default function ProfitWaterfallBridge() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <LockDimFeactureOverlay />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Profit Waterfall Bridge
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Step-by-step breakdown from Gross Revenue to Net Profit
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={mockWaterfallData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barCategoryGap="25%"
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickFormatter={fmtK}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            ticks={[0, 30000, 60000, 90000, 120000]}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {mockWaterfallData.map((entry, i) => (
              <Cell key={i} fill={BAR_COLORS[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
