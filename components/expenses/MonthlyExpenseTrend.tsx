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
} from "recharts";
import { mockMonthlyExpenseTrendData } from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

const CATEGORY_COLORS: Record<string, string> = {
  Labor: "#6366f1",
  COGS: "#60a5fa",
  Rent: "#ec4899",
  Utilities: "#f59e0b",
  Marketing: "#22c55e",
  Supplies: "#06b6d4",
  Maintenance: "#a855f7",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const CustomTooltip = ({ active, payload, label }: any) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);

  const fmtK = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.dataKey}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {fmtK(entry.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-1.5 mt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-900">{fmtK(total)}</span>
      </div>
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3">
    {CATEGORIES.map((cat) => (
      <div key={cat} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
        />
        <span className="text-xs" style={{ color: CATEGORY_COLORS[cat] }}>
          {cat}
        </span>
      </div>
    ))}
  </div>
);

export default function MonthlyExpenseTrend() {
  const { currency } = useCurrency();

  const fmtK = (v: number) => {
    return `${currency.symbol} ${formatCompactNumber(v)}`;
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="Monthly Expense Trend" />

      <div>
        <h2 className="text-sm font-bold text-gray-900">
          Monthly Expense Trend by Category
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Stacked breakdown of expenses over the last 6 months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={mockMonthlyExpenseTrendData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          barCategoryGap="25%"
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickFormatter={fmtK}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            ticks={[0, 15000, 30000, 45000, 60000]}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Legend content={<CustomLegend />} />

          {CATEGORIES.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="expenses"
              fill={CATEGORY_COLORS[cat]}
              radius={i === CATEGORIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
