"use client";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useEffect, useRef, useState } from "react";
import { PaymentMethodRevenue } from "@/services/paymentMethods.client";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { ChevronDown } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";

interface PaymentMethodDataWithColor extends PaymentMethodRevenue {
  color: string;
  percentage: number;
}

interface PaymentMethodsChartProps {
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
    const entry = payload[0].payload as PaymentMethodDataWithColor;
    const sales = entry.transactionCount;
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-500 text-xs">{entry.paymentMethod}</p>
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

const PaymentMethodsChart = ({
  startDate,
  endDate,
}: PaymentMethodsChartProps) => {
  const { currency } = useCurrency();
  // Suspense query — loading is handled by the page's <Suspense> fallback and
  // errors by the page's <ChartErrorBoundary>. `data` is always defined here.
  const { data } = usePaymentMethods(startDate, endDate);

  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

  const coloredData: PaymentMethodDataWithColor[] = data.map((entry, i) => ({
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
        <ComponentHeader
          title="Payment Methods"
          subHeader=" Revenue split by payment type"
        />
      </div>

      {data.length === 0 ? (
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
            No payment data found
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
                    <Cell
                      key={entry.paymentMethod}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              className=" mt-2
    px-2
    h-20
    overflow-y-auto
    space-y-3
    scrollbar-hide
    [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden"
            >
              {coloredData.map((entry) => (
                <div
                  key={entry.paymentMethod}
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
                      {entry.paymentMethod}
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
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pb-1">
                <ChevronDown className="h-4 w-4 text-gray-400 animate-bounce" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsChart;
