"use client";
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

import { mockStaffRevenue } from "../../../lib/mockData/mock-staffdata";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

export interface StaffRevenue {
  name: string;
  revenue: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-blue-500 font-bold text-sm">
          {formatCurrency(payload[0].value as number, currency)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[6, 6, 0, 0]} fill="#60a5fa" />
);

export interface StaffRevenueProps {
  data: StaffRevenue[];
}

export default function RevenueStaffChart({ data }: StaffRevenueProps) {
  const { currency } = useCurrency();
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockStaffRevenue : data;
  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol}${value / 1000}k`
      : formatCurrency(value, currency);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition duration-300 md:p-6 w-full">
      {isEmpty && <SampleDataBadge />}
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[16px] md:text-xl font-bold mt-1 text-gray-900">
          Revenue per Staff
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Individual contribution to total revenue
        </p>
      </div>

      {/* Chart */}
      <div className="h-55 md:h-75">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{
              top: 0,
              right: 20,
              left: 20,
              bottom: 0,
            }}
            barCategoryGap="15%"
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 13,
              }}
              dy={10}
            />

            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              ticks={[0, 2000, 4000, 6000, 8000]}
              domain={[0, 8500]}
              width={60}
            />

            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{
                fill: "rgba(96,165,250,0.05)",
              }}
            />

            <Bar dataKey="revenue" shape={CustomBar} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
