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
import { ChartCard, ChartTooltipBox } from "../chartCard";

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

      <div className="flex h-full flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-8">
        {/* Donut chart. `min-h` because a flex child with a percentage-height
            chart inside collapses to nothing without one. */}
        <div className="relative flex min-h-[220px] flex-1 items-center justify-center sm:max-w-[260px]">
          <ResponsiveContainer width="100%" height="100%">
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
            <span className="text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
              Total Lost
            </span>

            <span
              className="text-lg font-semibold tracking-tight"
              style={{ color: "#e11d48" }}
            >
              {formatCurrencySymbol(total, currency.symbol, currency.locale)}
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 self-start">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-2.5 last:border-0 border-[#e8eaed] dark:border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
                  {item.reason}
                </span>
                <span className="text-xs tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                  ({item.refunds})
                </span>
              </div>
              <span className="text-[13px] font-medium tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                {formatCurrencySymbol(
                  item.amount,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
