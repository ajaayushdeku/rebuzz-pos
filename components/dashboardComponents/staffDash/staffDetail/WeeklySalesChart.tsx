"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import { useCurrency } from "@/providers/CurrencyContext";
import { parseNepalDateTime, type BillItem } from "./staffDetailHelpers";
import { Loader2 } from "lucide-react";
import { BarChart3 } from "lucide-react";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "../../chartCard";

interface WeeklySalesChartProps {
  employeeId: string;
}

interface DayData {
  label: string;
  orders: number;
  revenue: number;
  dateStr: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The bars' one colour, shared by the bar shape and the hover box. */
const BAR_COLOR = "#3b82f6";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currency: { symbol: string; locale: string };
}) => {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox
      label={label}
      rows={[
        {
          name: "Sales",
          // The bars are one fixed colour, set on CustomBar below.
          color: BAR_COLOR,
          value: String(payload[0].value),
        },
      ]}
    />
  );
};

const CustomBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={BAR_RADIUS} fill={BAR_COLOR} />
);

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Compute a 7-day date range starting from 6 days ago to today */
function getLast7DaysRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const end = toDateStr(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return { startDate: toDateStr(start), endDate: end };
}

const WeeklySalesChart = ({ employeeId }: WeeklySalesChartProps) => {
  const { currency } = useCurrency();
  const [weekBills, setWeekBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  // Fetch bills for the last 7 days only — independent of parent date range.
  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    const { startDate, endDate } = getLast7DaysRange();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/staff/sales-by-employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!res.ok) throw new Error("Failed to load weekly sales");
        const json = await res.json();
        if (!cancelled) setWeekBills(json?.data?.employeeData?.bills ?? []);
      } catch (err) {
        if (!cancelled) {
          setWeekBills([]);
          setError(
            err instanceof Error ? err.message : "Failed to load weekly sales",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId, reloadFlag]);

  const weekRange = useMemo(() => getLast7DaysRange(), []);

  const chartData = useMemo(() => {
    const today = new Date();
    const days: DayData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayLabel = DAY_LABELS[d.getDay()];
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const dayNum = d.getDate();
      days.push({
        label: `${dayLabel}, ${month} ${dayNum}`,
        orders: 0,
        revenue: 0,
        dateStr: toDateStr(d),
      });
    }

    const dateIndexMap = new Map<string, number>();
    days.forEach((day, idx) => dateIndexMap.set(day.dateStr, idx));

    weekBills.forEach((bill) => {
      const d = parseNepalDateTime(bill.paidAt);
      if (!d) return;
      const billDateStr = toDateStr(d);
      const idx = dateIndexMap.get(billDateStr);
      if (idx !== undefined) {
        days[idx].orders += 1;
        days[idx].revenue += bill.grandTotal ?? bill.totalAmount ?? 0;
      }
    });

    return days.map((d) => ({
      name: d.label,
      orders: d.orders,
    }));
  }, [weekBills]);

  const isEmpty = !loading && chartData.every((d) => d.orders === 0);
  const displayData = isEmpty
    ? chartData.map((d) => ({ ...d, orders: 0 }))
    : chartData;

  const maxOrders = Math.max(...displayData.map((d) => d.orders), 1);
  const yMax = maxOrders <= 1 ? 2 : maxOrders * 3;

  return (
    <ChartCard
      icon={BarChart3}
      title="Sales This Week"
      info={{
        heading: "Reading this chart",
        // Always the current week, regardless of the page's range.
        body: "Bills this employee took on each day of the current week — it does not follow the date range at the top of the page. The number above a bar is that day's count.",
      }}
      subtitle={`${weekRange.startDate} to ${weekRange.endDate} · ${chartData.reduce(
        (s, d) => s + d.orders,
        0,
      )} total sales`}
      className="h-full"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            size={20}
            className="animate-spin"
            style={{ color: CHART_PALETTE.subtitle }}
          />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            {error}
          </p>
          <button
            onClick={() => setReloadFlag((f) => f + 1)}
            className="mt-3 cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            Retry
          </button>
        </div>
      ) : (
        // ) : !isEmpty ? (
        //   <div className="text-center py-12">
        //     <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
        //       <svg
        //         className="w-6 h-6 text-gray-300"
        //         fill="none"
        //         viewBox="0 0 24 24"
        //         stroke="currentColor"
        //         strokeWidth={2}
        //       >
        //         <path
        //           strokeLinecap="round"
        //           strokeLinejoin="round"
        //           d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        //         />
        //       </svg>
        //     </div>
        //     <p className="text-sm font-medium text-gray-500">
        //       No sales this week
        //     </p>
        //     <p className="text-xs text-gray-400 mt-1">
        //       No sales recorded for this period
        //     </p>
        //   </div>
        <div className="h-56 md:h-85">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                dy={8}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={70}
                domain={[0, yMax]}
                label={yAxisTitle("Sales")}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ fill: CHART_PALETTE.hover }}
              />
              <Bar
                dataKey="orders"
                shape={CustomBar}
                radius={BAR_RADIUS}
                label={{
                  position: "top",
                  fill: CHART_PALETTE.axis,
                  fontSize: 11,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default WeeklySalesChart;
