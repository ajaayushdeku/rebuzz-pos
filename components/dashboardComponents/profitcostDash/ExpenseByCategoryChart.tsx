"use client";

import { CurrencyConfig } from "@/lib/config/store";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import { mockExpenseByCategoryData } from "@/lib/mockData/mock-profitcostdata";

// Types

export interface ExpenseCategory {
  name: string;
  value: number;
}
interface ExpenseCategoryWithColor extends ExpenseCategory {
  color: string;
}

const COLOR_PALETTE = [
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#fb923c", // orange
  "#34d399", // green
  "#22d3ee", // cyan
  "#818cf8", // indigo
];

// Tooltip

interface CustomTooltipProps {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyConfig;
  total: number;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
  total,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as ExpenseCategoryWithColor;

  const pct = ((entry.value / total) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-36">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs font-semibold text-gray-700">
          {entry.name}
        </span>
      </div>
      <p className="text-sm font-bold text-gray-900">
        {formatCurrency(entry.value as number, currency)}
      </p>
      <p className="text-xs text-gray-400">{pct}% of total</p>
    </div>
  );
};

// Legend

const CustomLegend = ({ data }: { data: ExpenseCategoryWithColor[] }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-3 px-1">
    {data.map((entry) => (
      <div key={entry.name} className="flex items-center gap-1.5">
        <span
          className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs md:text-sm text-gray-600">{entry.name}</span>
      </div>
    ))}
  </div>
);

// Chart

export interface ExpensesByCategoryProps {
  data: ExpenseCategory[];
}

export default function ExpensesByCategoryChart({
  data,
}: ExpensesByCategoryProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockExpenseByCategoryData : data;
  const { currency } = useCurrency();
  const coloredData: ExpenseCategoryWithColor[] = displayData.map(
    (entry, i) => ({
      ...entry,
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    }),
  );
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full">
      {isEmpty && <SampleDataBadge />}
      {/* Header */}
      <div className="mb-4">
        <h2 className="md:text-xl text-[16px] font-bold text-gray-900">
          Expenses by Category
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Share of total expenses this month
        </p>
      </div>

      {/* Donut */}
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={108}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {coloredData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip currency={currency} total={total} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-base font-bold text-gray-900">
            {currency.symbol}
            {(total / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      {/* Legend */}
      <CustomLegend data={coloredData} />
    </div>
  );
}
