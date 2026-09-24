"use client";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatNumber } from "@/utils/helper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useEffect, useRef, useState } from "react";
import { PaymentMethodRevenue } from "@/services/paymentMethods.client";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { ChevronDown, CreditCard } from "lucide-react";
import {
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
} from "@/components/dashboardComponents/chartCard";
import RangeBadge from "@/components/ui/RangeBadge";

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
  "#14b8a6",
  "#8b5cf6",
  "#60a5fa",
  "#f97316",
  "#34d399",
  "#f87171",
  "#06b6d4",
  "#a78bfa",
  "#ec4899",

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
      <ChartTooltipBox
        label={
          entry.paymentMethod === "Qr payment"
            ? "QR Payment"
            : entry.paymentMethod
        }
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
          { name: "Sales", color: entry.color, value: formatNumber(sales) },
        ]}
      />
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
    <ChartCard
      icon={CreditCard}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / 50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Payment Methods"
      info={{
        heading: "Reading this chart",
        // Revenue share, not transaction counts.
        body: "Each slice is a payment type's share of revenue over the selected date range — not how many transactions used it. Hover a slice for its revenue and sale count.",
      }}
      subtitle="Revenue split by payment type"
      controls={<RangeBadge variant="pill" />}
    >
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <CreditCard size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No payment method data found</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
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
    h-14
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
                    <span
                      className="truncate text-xs"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {entry.paymentMethod === "Qr payment"
                        ? "QR Payment"
                        : entry.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-30 overflow-hidden rounded-full bg-[#f1f3f4]">
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
                    <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-[#5f6368]">
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

            {showScrollHint && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pb-1">
                <ChevronDown className="h-4 w-4 animate-bounce text-[#9aa0a6]" />
              </div>
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
};

export default PaymentMethodsChart;
