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
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactNumber } from "@/utils/helper";

const BAR_COLORS: Record<string, string> = {
  start: "#64748b",
  deduct: "#f43f5e",
  result: "#22c55e",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { currency } = useCurrency();

  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-500">
        Running total:{" "}
        <span className="font-bold text-gray-800">
          {formatCurrencySymbol(d.value, currency.symbol, currency.locale)}
        </span>
      </p>
      {d.deduction > 0 && (
        <p className="text-red-500">
          Deduction:{" "}
          <span className="font-bold">
            −
            {formatCurrencySymbol(
              d.deduction,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </p>
      )}
    </div>
  );
};

export default function ProfitWaterfallBridge() {
  const { currency } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Prime Water Bridge" />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-900">
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
            tickFormatter={(v) =>
              `${currency.symbol} ${formatCompactNumber(v)}`
            }
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
