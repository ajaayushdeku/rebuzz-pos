"use client";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export interface CategorySalesData {
  name: string;
  totalSales: number;
  totalRevenue: number;
  netProfit: number;
}

interface CategorySalesDataWithColor extends CategorySalesData {
  color: string;
  percentage: number;
}

interface SalesCategoryChartProps {
  data: CategorySalesData[];
}

const COLOR_PALETTE = [
  "#60a5fa",
  "#f97316",
  "#14b8a6",
  "#f87171",
  "#06b6d4",
  "#8b5cf6",
  "#a78bfa",
  "#ec4899",
  "#34d399",
  "#f59e0b",
];

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  const { currency } = useCurrency();

  if (active && payload?.length) {
    const entry = payload[0].payload as CategorySalesDataWithColor;
    const sales = entry.totalSales;
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-500 text-xs">{entry.name}</p>
        <p className="font-bold text-sm" style={{ color: entry.color }}>
          {entry.percentage.toFixed(1)}%
        </p>

        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center justify-between  gap-4">
            {" "}
            <span className="text-xs text-gray-500 items-left">Revenue</span>
            <span className="text-xs items-right font-bold  text-gray-600">
              {formatCurrencySymbol(
                entry.totalRevenue,
                currency.symbol,
                currency.locale,
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            {" "}
            <span className="text-xs text-gray-500 items-left">Sales</span>
            <span className="text-xs font-bold text-gray-600">
              {formatCurrencySymbol(sales, currency.symbol, currency.locale)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const SalesCategoryChart = ({ data }: SalesCategoryChartProps) => {
  const { currency } = useCurrency();
  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

  const coloredData: CategorySalesDataWithColor[] = data.map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    percentage:
      totalRevenue > 0 ? (entry.totalRevenue / totalRevenue) * 100 : 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-center py-2">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={2}
              dataKey="totalRevenue"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
            >
              {coloredData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-3 px-2">
        {coloredData.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: entry.color,
                }}
              />
              <span className="text-xs text-gray-700 truncate">
                {entry.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-30 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${entry.percentage}%`,
                    backgroundColor: entry.color,
                    opacity: 0.6,
                  }}
                />
              </div>

              <span className="text-xs font-semibold text-gray-700 w-20 text-right">
                {formatCurrencySymbol(
                  entry.totalRevenue,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesCategoryChart;
