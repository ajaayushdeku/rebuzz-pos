"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ChartSpline } from "lucide-react";
import { mockVATTrendData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";

const INPUT_COLOR = "#22c55e";
const NET_COLOR = "#f59e0b";
const OUTPUT_COLOR = "#6366f1";

const FmtRs = (v: number) => {
  const { currency } = useCurrency();
  return formatCompactCurrency(v, currency.symbol, currency.locale);
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: entry.color ?? CHART_PALETTE.blue,
        value: formatCurrencySymbol(
          Number(entry.value) || 0,
          currency.symbol,
          currency.locale,
        ),
      }))}
    />
  );
};

export default function VATTrendChart() {
  return (
    <ChartCard
      icon={ChartSpline}
      title="Input vs Output VAT Trend"
      subtitle="How much VAT you collect vs reclaim, over 6 months"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the chart. */}
      <LockDimFeactureOverlay component_name="VAT Trend Chart" />

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={mockVATTrendData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            dy={8}
          />
          <YAxis
            tickFormatter={FmtRs}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            ticks={[0, 40000, 80000, 120000, 160000]}
            width={80}
            label={yAxisTitle("VAT amount")}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Input VAT — green solid */}
          <Line
            type="monotone"
            dataKey="inputVAT"
            name="Input VAT (reclaimed)"
            stroke={INPUT_COLOR}
            strokeWidth={2.5}
            dot={{ r: 4, fill: "white", stroke: INPUT_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />

          {/* Net Payable — amber dashed */}
          <Line
            type="monotone"
            dataKey="netPayable"
            name="Net Payable"
            stroke={NET_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "white", stroke: NET_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />

          {/* Output VAT — indigo solid */}
          <Line
            type="monotone"
            dataKey="outputVAT"
            name="Output VAT (collected)"
            stroke={OUTPUT_COLOR}
            strokeWidth={2.5}
            dot={{ r: 4, fill: "white", stroke: OUTPUT_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <ChartLegend
        items={[
          {
            label: "Input VAT (reclaimed)",
            color: INPUT_COLOR,
            shape: "line",
          },
          { label: "Net Payable", color: NET_COLOR, shape: "dashed" },
          {
            label: "Output VAT (collected)",
            color: OUTPUT_COLOR,
            shape: "line",
          },
        ]}
      />
    </ChartCard>
  );
}
