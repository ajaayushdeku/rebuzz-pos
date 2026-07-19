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
import { ComponentHeader } from "@/components/ComponentHeader";

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
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <span className="text-xs font-bold text-gray-800 ">
        {payload[0].value} sales
      </span>
    </div>
  );
};

const CustomBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[6, 6, 0, 0]} fill="#3b82f6" />
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>

          <ComponentHeader
            title="Sales This Week"
            subHeader={`${weekRange.startDate} to ${weekRange.endDate}  ·
              ${chartData.reduce((s, d) => s + d.orders, 0)} total sales`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-blue-500" />
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
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <button
            onClick={() => setReloadFlag((f) => f + 1)}
            className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            No orders this week
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No sales recorded for this period
          </p>
        </div>
      ) : (
        <div className="h-56 md:h-85">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                dy={8}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                width={30}
                domain={[0, yMax]}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ fill: "rgba(59,130,246,0.05)" }}
              />
              <Bar
                dataKey="orders"
                shape={CustomBar}
                label={{
                  position: "top",
                  fill: "#6b7280",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WeeklySalesChart;
