"use client";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
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
  /** Global date range — resolved by the wrapper from the dashboard filter. */
  startDate?: string;
  endDate?: string;
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
            <span className="text-xs font-bold text-gray-600">{sales}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const SalesCategoryChart = ({
  startDate,
  endDate,
}: SalesCategoryChartProps) => {
  const { currency } = useCurrency();
  const { data, isLoading, error } = useSalesByCategory(startDate, endDate);

  // Sort by totalRevenue descending, rename "No Category" → "Uncategorized"
  const sorted = [...(data ?? [])]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((entry) => ({
      ...entry,
      name: entry.name === "No Category" ? "Uncategorized" : entry.name,
    }));

  const totalRevenue = sorted.reduce((sum, d) => sum + d.totalRevenue, 0);

  const coloredData: CategorySalesDataWithColor[] = sorted.map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
    percentage:
      totalRevenue > 0 ? (entry.totalRevenue / totalRevenue) * 100 : 0,
  }));

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollHint = () => {
      const canScroll = el.scrollHeight > el.clientHeight;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

      setShowScrollHint(canScroll && !atBottom);
    };

    updateScrollHint();

    el.addEventListener("scroll", updateScrollHint);
    window.addEventListener("resize", updateScrollHint);

    return () => {
      el.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, [coloredData]);

  return (
    <div className="w-full bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
      {/* Header — follows the global date range */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900">Sales by Category</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Revenue share across product categories
        </p>
      </div>

      {isLoading ? (
        <CategoryLoading />
      ) : error || !data ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Failed to load category data
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            No category data found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No sales recorded for the selected date range.
          </p>
        </div>
      ) : (
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

      <div className="relative">
        <div
          ref={scrollRef}
          className="  mt-2
    px-2
    h-22
    overflow-y-auto
    space-y-3
    scrollbar-hide
    [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden"
        >
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
                      opacity: 0.8,
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

            {showScrollHint && (
              <div className="pointer-events-none absolute bottom-[-15px] left-0 right-0 flex justify-center pt-8 pb-1">
                <ChevronDown className="h-4 w-4 text-gray-400 animate-bounce" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Loading placeholder for the pie + legend. */
function CategoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-center py-2">
        <div className="w-[164px] h-[164px] rounded-full border-[14px] border-gray-100" />
      </div>
      <div className="mt-2 px-2 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <span className="h-1.5 w-30 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SalesCategoryChart;
