"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { mockExpensesByCategoryData } from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";

const CustomTooltip = ({ active, payload }: any) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-gray-700">{d.label}</p>
      <p className="text-gray-500 mt-0.5">
        {formatCurrencySymbol(d.value, currency.symbol, currency.locale)}
      </p>
    </div>
  );
};

export default function ExpensesByCategory() {
  const { currency } = useCurrency();

  const data = mockExpensesByCategoryData;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="Expenses By Category" />

      <div>
        <h2 className="text-sm font-bold text-gray-900">
          Expenses by Category
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Share of total expenses this month
        </p>
      </div>

      {/* Donut */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                startAngle={90}
                endAngle={-270}
                strokeWidth={2}
                stroke="#f9fafb"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400">Total</p>
            <p className="text-sm font-bold text-gray-900">
              {currency.symbol} {formatCompactNumber(total / 1000)}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] text-gray-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
