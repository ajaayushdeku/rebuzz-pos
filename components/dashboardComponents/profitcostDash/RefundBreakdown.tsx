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
import { ComponentHeader } from "@/components/ComponentHeader";

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
    <div
      className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-36 "
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs font-semibold text-gray-700">
          {entry.reason}
        </span>
      </div>
      <p className="text-sm font-bold text-gray-900">
        {formatCurrencySymbol(entry.amount, currency.symbol, currency.locale)}
      </p>
      <p className="text-xs text-gray-400">{pct}% of total</p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

export default function RefundBreakdown() {
  const { currency } = useCurrency();
  const data = refundBreakdownMock;
  const total = totalRefundLoss;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full relative select-none">
      {/* Lock overlay */}
      <LockDimFeactureOverlay component_name="Refund Breakdown" />

      {/* Header */}
      <ComponentHeader
        title="Refund Breakdown"
        subHeader="Value lost by refund reason"
      />

      {/* Donut chart */}
      <div className="relative flex items-center justify-center shrink-0">
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
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <span className="text-xs text-gray-400">Total Lost</span>
          <span className="text-2xl font-bold text-red-500">
            {formatCurrencySymbol(total, currency.symbol, currency.locale)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full space-y-4 mt-6">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700">
                  {item.reason}
                </span>
                <span className="text-xs text-gray-400">({item.refunds})</span>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-900">
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
  );
}
