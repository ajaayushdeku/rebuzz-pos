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
import { mockVarianceData } from "@/lib/mockData/mock-profitcost-advanced";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactNumber } from "@/utils/helper";

const BAR_COLORS: Record<string, string> = {
  base: "#94a3b8",
  positive: "#22c55e",
  negative: "#f43f5e",
  result: "#94a3b8",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { currency } = useCurrency();

  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const isPositive = d.type === "positive";
  const isNegative = d.type === "negative";

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p>
        Value:{" "}
        <span
          className={`font-bold ${isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-gray-800"}`}
        >
          {formatCurrencySymbol(d.value, currency.symbol, currency.locale)}
        </span>
      </p>
      {isPositive && (
        <p className="text-green-500 text-[10px] mt-0.5">↑ Positive impact</p>
      )}
      {isNegative && (
        <p className="text-red-400 text-[10px] mt-0.5">↓ Negative impact</p>
      )}
    </div>
  );
};

// Legend
const LEGEND_ITEMS = [
  { label: "Positive impact", color: "#22c55e" },
  { label: "Negative impact", color: "#f43f5e" },
  { label: "Net values", color: "#94a3b8" },
];

export default function ProfitVarianceBridge() {
  const { currency } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <LockDimFeactureOverlay />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Profit Variance Bridge
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Why did net profit change vs last month?
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={mockVarianceData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barCategoryGap="20%"
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
            tickFormatter={(v) =>
              `${currency.symbol} ${formatCompactNumber(v)}`
            }
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            ticks={[0, 20000, 40000, 60000, 80000]}
            domain={[0, 85000]}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {mockVarianceData.map((entry, i) => (
              <Cell key={i} fill={BAR_COLORS[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {LEGEND_ITEMS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
