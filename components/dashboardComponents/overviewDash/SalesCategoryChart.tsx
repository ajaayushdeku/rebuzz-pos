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
import {
  ChartCard,
  ChartTooltipBox,
} from "@/components/dashboardComponents/chartCard";
import RangeBadge from "@/components/ui/RangeBadge";

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

/**
 * The slice colours. One palette for both themes: every hue here is a mid-tone
 * that holds its own on white and on the dark card, so a category is the same
 * colour whichever theme the reader is in.
 *
 * Ten, because that is where a reader stops telling slices apart; an eleventh
 * category restarts at the first.
 */
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

// const formatCurrency = (value: number): string => {
//   if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
//   if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
//   return value.toFixed(0);
// };

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
      <ChartTooltipBox
        label={entry.name}
        rows={[
          {
            name: "Share",
            color: entry.color,
            value: `${entry.percentage.toFixed(1)}%`,
          },
          {
            name: "Revenue",
            color: entry.color,
            value: formatCurrencySymbol(
              entry.totalRevenue,
              currency.symbol,
              currency.locale,
            ),
          },
          {
            name: "Items sold",
            color: entry.color,
            value: formatNumber(sales),
          },
        ]}
      />
    );
  }
  return null;
};

const SalesCategoryChart = ({
  startDate,
  endDate,
}: SalesCategoryChartProps) => {
  // const { currency } = useCurrency();

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
    <ChartCard
      icon={ChartPie}
      // Sky, as before: Tailwind's sky-600 / sky-200 / sky-50.
      iconColor="#0284c7"
      iconBorder="#bae6fd"
      iconBg="#f0f9ff"
      title="Sales by Category"
      rangeBadge={true}
      info={{
        heading: "Reading this chart",
        // Revenue share, not item counts.
        body: "Each slice is a category's share of revenue over the selected date range — not how many items it sold. The list below repeats the shares in order, largest first; hover a slice for its revenue and item count.",
      }}
      subtitle="Revenue share across product categories"
      controls={
        <div className="hidden lg:block">
          <RangeBadge variant="pill" />
        </div>
      }
    >
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <ChartPie size={24} className="text-gray-500 dark:text-[#9aa6bd]" />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No category data found
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            No sales recorded for the selected date range
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
                  paddingAngle={0.5}
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
              className="  mt-2 px-2 h-22 overflow-y-auto space-y-3 scrollbar-hide    [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    <span className="truncate text-xs text-[#3c4043] dark:text-[#c3ccdc]">
                      {entry.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-30 overflow-hidden rounded-full bg-[#f1f3f4] dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${entry.percentage}%`,
                          backgroundColor: entry.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>

                    <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-[#5f6368] dark:text-[#9aa6bd]">
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
                <ChevronDown className="h-4 w-4 animate-bounce text-[#9aa0a6] dark:text-[#7b869b]" />
              ) : (
                <ChevronUp className="h-4 w-4 animate-bounce text-[#9aa0a6] dark:text-[#7b869b]" />
              )}
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

export default SalesCategoryChart;
