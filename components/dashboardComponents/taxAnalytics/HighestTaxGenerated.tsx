"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface TaxableItem {
  name: string;
  totalTaxAmount: number;
  transactionCount: number;
}

const CHART_COLORS = ["#F59E0B", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-gray-600">Tax Amount</span>
        <span className="font-bold text-amber-600">
          {formatCurrencySymbol(
            payload[0].value as number,
            currency.symbol,
            currency.locale,
          )}
        </span>
      </div>
    </div>
  );
};

const HighestTaxGenerated = ({ data }: { data: TaxableItem[] }) => {
  const { currency } = useCurrency();
  const sorted = [...data].sort((a, b) => b.totalTaxAmount - a.totalTaxAmount);
  const top = sorted.slice(0, 5);

  if (top.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        No tax data available
      </p>
    );
  }

  const chartData = top.map((item) => ({
    name: item.name,
    amount: item.totalTaxAmount,
  }));

  return (
    <div className="space-y-4">
      {/* Winner highlight */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-gray-800">
              {top[0].name}
            </span>
          </div>
          <span className="text-sm font-bold text-amber-600">
            {formatCurrencySymbol(
              top[0].totalTaxAmount,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 ml-7">
          {top[0].transactionCount} transactions
        </p>
      </div>

      {/* Bar chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#f3f4f6"
              strokeDasharray="3 3"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              width={50}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              width={80}
              tickFormatter={(val: string) =>
                val.length > 10 ? val.slice(0, 9) + "…" : val
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar dataKey="amount" name="Tax Amount" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranked list */}
      <div className="space-y-1.5">
        {top.slice(1).map((item, i) => {
          const maxAmount = top[0].totalTaxAmount;
          const barWidth =
            maxAmount > 0 ? (item.totalTaxAmount / maxAmount) * 100 : 0;
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="w-5 text-xs font-bold text-gray-300 text-right">
                {i + 2}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {item.name}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 shrink-0 ml-2">
                    {formatCurrencySymbol(
                      item.totalTaxAmount,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HighestTaxGenerated;
