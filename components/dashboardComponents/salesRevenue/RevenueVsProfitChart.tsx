"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";

import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/utils/helper";
import { CurrencyConfig, useCurrency } from "@/providers/CurrencyContext";
import { useRevenueVsProfit } from "@/hooks/useRevenueVsProfit";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";

// Types

export interface ProductData {
  product: string;
  revenue: number;
  profit: number;
}

// Sub-components

const RevenueBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#60a5fa" />
);

const ProfitBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[4, 4, 0, 0]} fill="#34d399" />
);

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {[
      { label: "Profit", color: "#34d399" },
      { label: "Revenue", color: "#60a5fa" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyConfig;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-36">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color as string,
              }}
            />
            <span className="text-xs text-gray-600 capitalize">
              {entry.name}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {formatCurrency(entry.value as number, currency)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Chart — fetches data via hook

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = toDateStr(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: toDateStr(start), endDate };
}

export default function RevenueVsProfitChart() {
  // Read dates directly from URL (CalendarDateFilter updates the URL)
  const searchParams = useSearchParams();
  const urlStartDate = searchParams.get("startDate");
  const urlEndDate = searchParams.get("endDate");

  // Fallback to last 30 days if no dates provided
  const defaultRange = getDefaultRange();
  const effectiveStartDate = urlStartDate || defaultRange.startDate;
  const effectiveEndDate = urlEndDate || defaultRange.endDate;

  const { data, isFetching, isError } = useRevenueVsProfit(
    effectiveStartDate,
    effectiveEndDate,
  );
  const { currency } = useCurrency();

  const displayData =
    data && data.length > 0
      ? data
      : [
          {
            product: "No Data",
            revenue: 0,
            profit: 0,
          },
        ];

  const formatYAxis = (value: number): string =>
    value >= 1000 || value <= -1000
      ? `${currency.symbol}${(value / 1000).toFixed(1)}k`
      : formatCurrency(value, currency);

  // ── Dynamic Y-axis that handles negative profit ──
  const allValues =
    displayData.length > 0
      ? displayData.flatMap((d) => [d.revenue, d.profit])
      : [0];

  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  const yAxisMax = Math.max(1000, Math.ceil(maxValue / 500) * 500 + 500);
  const yAxisMin = minValue < 0 ? Math.floor(minValue / 500) * 500 - 500 : 0;

  const tickRange = yAxisMax - yAxisMin;
  const tickStep = Math.ceil(tickRange / 5 / 500) * 500;
  const ticks = Array.from(
    { length: Math.ceil(tickRange / tickStep) + 1 },
    (_, i) => yAxisMin + i * tickStep,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm md:p-6 p-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
            Revenue vs Profit by Product
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Comparing top-line revenue against net profit per product
          </p>
          {isError && (
            <p className="text-xs text-amber-400 mt-1">
              Could not refresh — showing last known data.
            </p>
          )}
        </div>

        {/* Calendar date filter */}
        <div className="self-start">
          <CalendarDateFilter showPresets={false} />
        </div>
      </div>

      {/* Chart */}
      <div
        className={`transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
      >
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
              barCategoryGap="15%"
              barGap={4}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="product"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                dy={8}
              />
              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                domain={[yAxisMin, yAxisMax]}
                width={55}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{
                  fill: "rgba(0,0,0,0.03)",
                }}
              />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="revenue" name="Revenue" shape={RevenueBar} />
              <Bar dataKey="profit" name="Profit" shape={ProfitBar} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
