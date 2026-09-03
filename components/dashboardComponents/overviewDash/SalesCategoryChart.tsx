"use client";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatNumber } from "@/utils/helper";
import { ChevronDown, ChartPie, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ComponentHeader } from "@/components/ComponentHeader";

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
  "#8b5cf6",
  "#60a5fa",
  "#f97316",
  "#14b8a6",
  "#f87171",
  "#06b6d4",
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
            <span className="text-xs text-gray-500 items-left">Items Sold</span>
            <span className="text-xs font-bold text-gray-600">
              {formatNumber(sales)}
            </span>
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
  // Suspense query — loading is handled by the page's <Suspense> fallback and
  // errors by the page's <ChartErrorBoundary>. `data` is always defined here.
  const { data } = useSalesByCategory(startDate, endDate);

  // Sort by totalRevenue descending, rename "No Category" → "Uncategorized"
  const sorted = [...data]
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
      <div className="mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <ChartPie size={16} />
        </div>
        <ComponentHeader
          title="Sales by Category"
          subHeader=" Revenue share across product categories"
        />
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <ChartPie size={24} className="text-gray-400" />
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

                    {/* The figure the bar is drawing. A bar shows which rows
                        lead; only the number says by how much, and reading it
                        off a 7rem track is guesswork. Fixed width and tabular
                        digits so the amounts beside it stay in one column.
                        A share that rounds to 0.0% but is not zero is shown as
                        "<0.1%" rather than as nothing. */}
                    <span className="w-11 shrink-0 text-right text-[11px] font-medium tabular-nums text-gray-500">
                      {entry.percentage > 0 && entry.percentage < 0.1
                        ? "<0.1"
                        : entry.percentage.toFixed(1)}
                      %
                    </span>

                    {/* <span className="text-xs font-semibold text-gray-700 w-28 text-right">
                      {formatCurrencySymbol(
                        entry.totalRevenue,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-[-15px] left-0 right-0 flex justify-center pt-8 pb-1">
              {showScrollHint ? (
                <ChevronDown className="h-4 w-4 text-gray-400 animate-bounce" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-400 animate-bounce" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCategoryChart;
