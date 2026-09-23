"use client";

import { Calendar, ArrowRight } from "lucide-react";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { CHART_PALETTE, ChartCard } from "../chartCard";

export interface WhatYouOweData {
  collected: number;
  inputVat: number;
  refund: number;
  payable: number;
  dueDate: string;
}

interface WhatYouActuallyOweProps {
  data: WhatYouOweData;
}

/** One term of the equation: its label over the figure. */
function Term({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-[120px] flex-col gap-0.5 ${className}`}>
      <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
        {label}
      </p>
      <p
        className="text-xl font-semibold tracking-tight tabular-nums"
        style={{ color: CHART_PALETTE.title }}
      >
        {value}
      </p>
    </div>
  );
}

export default function WhatYouActuallyOwe({ data }: WhatYouActuallyOweProps) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
          What You Actually Owe
        </h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <ChartCard
        icon={ArrowRight}
        // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
        iconColor="#4f46e5"
        iconBorder="#c7d2fe"
        iconBg="#eef2ff"
        title="What you actually owe"
        subtitle="Your VAT bill this month"
        controls={
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px]"
            style={{
              borderColor: CHART_PALETTE.control,
              color: CHART_PALETTE.title,
            }}
          >
            <Calendar size={11} />
            Due: {data.dueDate}
          </span>
        }
        // Clipped so the lock overlay follows the card's rounded corners.
        className="overflow-hidden select-none"
      >
        {/* Lock overlay — a direct child of the card, so it covers the header
            as well as the figures. */}
        <LockDimFeactureOverlay component_name="What You Actually Owe" />

        {/* Equation row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {/* Collected — VAT collected from customers */}
          <Term label="Collected" value={fmt(data.collected)} />

          <span
            className="shrink-0 text-xl font-light"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            −
          </span>

          {/* Input VAT — VAT paid on purchases */}
          <Term
            label="Input VAT"
            value={fmt(data.inputVat)}
            className="text-center"
          />

          <span
            className="shrink-0 text-xl font-light"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            −
          </span>

          {/* Refund — VAT refunds claimed */}
          <Term
            label="Refund"
            value={fmt(data.refund)}
            className="text-center"
          />

          {/* Arrow */}
          <ArrowRight
            size={20}
            className="shrink-0"
            style={{ color: CHART_PALETTE.subtitle }}
          />

          {/* Net VAT Payable — what you actually owe */}
          <div className="min-w-[160px] shrink-0 rounded-2xl bg-blue-600 px-6 py-4 text-right">
            <p className="mb-0.5 text-[11px] text-blue-100">Net VAT payable</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-white">
              {fmt(data.payable)}
            </p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
