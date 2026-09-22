"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  refundBreakdownMock,
  totalRefundLoss,
} from "@/lib/mockData/mock-refundBreakDown";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { ChartPie } from "lucide-react";
import { CHART_PALETTE, ChartCard, ChartTooltipBox } from "../chartCard";

// ── Types ─────────────────────────────────────────────────────────────────

export interface RefundReason {
  id: string;
  reason: string;
  refunds: number;
  amount: number;
  color: string;
}

// ── Tooltip ───────────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  total: number;
  currency: { symbol: string; locale: string };
}

const CustomTooltip = ({
  active,
  payload,
  total,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as RefundReason;
  const pct = ((entry.amount / total) * 100).toFixed(1);

  return (
    <ChartTooltipBox
      label={entry.reason}
      rows={[
        {
          name: "Value lost",
          color: entry.color,
          value: formatCurrencySymbol(
            entry.amount,
            currency.symbol,
            currency.locale,
          ),
        },
        { name: "Share of total", color: entry.color, value: `${pct}%` },
      ]}
    />
  );
};

// ── Main Component ────────────────────────────────────────────────────────

export default function RefundBreakdown() {
  const { currency } = useCurrency();
  const data = refundBreakdownMock;
  const total = totalRefundLoss;

  return (
    <ChartCard
      icon={ChartPie}
      // Rose, as before: Tailwind's rose-600 / rose-200 / rose-50.
      iconColor="#e11d48"
      iconBorder="#fecdd3"
      iconBg="#fff1f2"
      title="Refund Breakdown"
      subtitle="Value lost by refund reason"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the chart. */}
      <LockDimFeactureOverlay component_name="Refund Breakdown" />

      {/* Donut chart */}
      <div className="relative flex shrink-0 items-center justify-center">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="white"
              strokeWidth={3}
            >
              {data.map((item) => (
                <Cell key={item.id} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip total={total} currency={currency} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="pointer-events-none absolute flex flex-col items-center justify-center"
          style={{ zIndex: 1 }}
        >
          <span className="text-[11px]" style={{ color: CHART_PALETTE.axis }}>
            Total Lost
          </span>
          <span className="text-2xl font-semibold tracking-tight text-red-500">
            {formatCurrencySymbol(total, currency.symbol, currency.locale)}
          </span>
        </div>
      </div>

      {/* Legend list: one row per reason, hairline-separated */}
      <div className="mt-6 w-full">
        {data.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b py-2.5 last:border-0"
            style={{ borderColor: CHART_PALETTE.grid }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span
                className="text-[13px]"
                style={{ color: CHART_PALETTE.title }}
              >
                {item.reason}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                ({item.refunds})
              </span>
            </div>
            <span
              className="text-[13px] font-medium tabular-nums"
              style={{ color: CHART_PALETTE.title }}
            >
              {formatCurrencySymbol(
                item.amount,
                currency.symbol,
                currency.locale,
              )}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
