"use client";

import { useMemo } from "react";
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
import { parseNepalDateTime } from "./staffDetailHelpers";
import type { BillItem } from "./staffDetailHelpers";

interface WeeklySalesChartProps {
  bills: BillItem[];
  startDate: string;
  endDate: string;
}

interface DayData {
  label: string;
  orders: number;
  revenue: number;
  dateStr: string; // "YYYY-MM-DD" for matching
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
      <p className="text-blue-500 font-bold text-sm">
        {payload[0].value} orders
      </p>
    </div>
  );
};

const CustomBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[6, 6, 0, 0]} fill="#3b82f6" />
);

/** Get YYYY-MM-DD from a Date, using local date parts to avoid timezone shifts */
const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const WeeklySalesChart = ({
  bills,
  startDate,
  endDate,
}: WeeklySalesChartProps) => {
  const { currency } = useCurrency();

  const chartData = useMemo(() => {
    // Build last 7 days from today (using local date)
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

    // Build a lookup map: dateStr -> index
    const dateIndexMap = new Map<string, number>();
    days.forEach((day, idx) => dateIndexMap.set(day.dateStr, idx));

    // Group bills by their date string (YYYY-MM-DD)
    bills.forEach((bill) => {
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
  }, [bills]);

  const isEmpty = chartData.every((d) => d.orders === 0);
  const displayData = isEmpty
    ? chartData.map((d) => ({ ...d, orders: 0 }))
    : chartData;

  const maxOrders = Math.max(...displayData.map((d) => d.orders), 1);
  const yTicks =
    maxOrders <= 1
      ? [0, 1]
      : Array.from({ length: 5 }, (_, i) => Math.round((maxOrders / 4) * i));
  const yMax = maxOrders <= 1 ? 2 : maxOrders * 1.5;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6">
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
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Orders This Week
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              {startDate} to {endDate} &middot;{" "}
              {chartData.reduce((s, d) => s + d.orders, 0)} total orders
            </p>
          </div>
        </div>
      </div>

      {isEmpty ? (
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
        <div className="h-56 md:h-64">
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
