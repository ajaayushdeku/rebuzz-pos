"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { ChartColumnBig } from "lucide-react";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";

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
      <ChartTooltipBox
        label={label}
        rows={[
          {
            name: "Revenue",
            color: payload[0].color ?? CHART_PALETTE.blue,
            value: formatCurrencySymbol(
              payload[0].value as number,
              currency.symbol,
              currency.locale,
            ),
          },
        ]}
      />
    );
  }
  return null;
};

const COLORS = [
  "#a78bfa",
  "#9c2a95",
  "#da2747",
  "#8ecd21",
  "#34d399",
  "#f59e0b",

  "#f472b6",
  "#60a5fa",
  "#fb923c",
  "#22d3ee",
  "#4ade80",
];

export interface StaffRevenueProps {
  data: StaffRevenue[];
}

export default function RevenueStaffChart({ data }: StaffRevenueProps) {
  const { currency } = useCurrency();
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? [{ name: "No Data", revenue: 0 }] : data;
  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  // Replace the hardcoded ticks/domain with dynamic calculation:
  const maxRevenue = Math.max(...displayData.map((d) => d.revenue), 1);
  const step = Math.ceil(maxRevenue / 4 / 1000) * 1000 || 1000;
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  return (
    <ChartCard
      icon={ChartColumnBig}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Revenue per Employee"
      info={{
        heading: "Reading this chart",
        // Revenue is attributed to whoever took the sale.
        body: "Revenue from the bills each employee took, over the date range at the top of the page. One bar per employee, so the bars add up to the range's takings rather than to profit.",
      }}
      subtitle="Individual contribution to total revenue"
      controls={<RangeBadge variant="pill" />}
    >
      {isEmpty && <SampleDataBadge />}

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
            <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              dy={10}
            />

            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              ticks={yTicks}
              domain={[0, yMax]}
              width={80}
              label={yAxisTitle("Revenue")}
            />

            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ fill: CHART_PALETTE.hover }}
            />

            <Bar dataKey="revenue" radius={BAR_RADIUS}>
              {displayData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
