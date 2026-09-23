"use client";

import { Calendar, CheckCircle2, CalendarClock } from "lucide-react";
import { mockAdvanceTaxInstallments } from "@/lib/mockData/mock-tax-data";
import type { InstallmentStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

const STATUS_CONFIG: Record<
  InstallmentStatus,
  { badge: string; badgeStyle: string; rightContent: "paid" | "awaiting" }
> = {
  paid: {
    badge: "Paid",
    badgeStyle: "bg-green-50 text-green-700 border border-green-200",
    rightContent: "paid",
  },
  pending: {
    badge: "Pending",
    badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    rightContent: "awaiting",
  },
  awaiting: {
    badge: "",
    badgeStyle: "",
    rightContent: "awaiting",
  },
};

export default function AdvanceTaxInstallments() {
  const { currency } = useCurrency();
  const installments = mockAdvanceTaxInstallments;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <ChartCard
      icon={CalendarClock}
      title="Advance Income Tax Installments"
      subtitle="Poush, Chaitra, and Ashad scheduled payments"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the installments. */}
      <LockDimFeactureOverlay component_name="Advance Tax Installments" />

      {/* Installment rows */}
      <div className="border-t" style={{ borderColor: CHART_PALETTE.grid }}>
        {installments.map((inst) => {
          const cfg = STATUS_CONFIG[inst.status];
          const isPaid = inst.status === "paid";

          return (
            <div
              key={inst.id}
              className="flex items-center justify-between gap-4 border-b py-3.5 last:border-0"
              style={{ borderColor: CHART_PALETTE.grid }}
            >
              {/* Left — period + badges + due date */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {inst.period}
                  </span>

                  {/* Paid so far pill */}
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] tabular-nums"
                    style={{
                      borderColor: CHART_PALETTE.control,
                      color: CHART_PALETTE.axis,
                    }}
                  >
                    {inst.paidSoFarPct}% paid so far
                  </span>

                  {/* Status badge */}
                  {cfg.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${cfg.badgeStyle}`}
                    >
                      {cfg.badge}
                    </span>
                  )}
                </div>

                <div
                  className="mt-1.5 flex items-center gap-1.5 text-[11px]"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  <Calendar size={11} />
                  <span>Due: {inst.dueDate}</span>
                </div>
              </div>

              {/* Right — estimated amount + paid / awaiting */}
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p
                    className="mb-0.5 text-[11px]"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    Est. amount
                  </p>
                  <p
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {fmt(inst.estimatedAmount)}
                  </p>
                </div>

                {isPaid ? (
                  <div className="flex min-w-[100px] items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5">
                    <CheckCircle2 size={13} className="text-green-600" />
                    <span className="text-xs tabular-nums text-green-700">
                      {fmt(inst.actualPaid ?? 0)}
                    </span>
                  </div>
                ) : (
                  <div
                    className="min-w-[100px] rounded-xl border px-4 py-1.5 text-center"
                    style={{ borderColor: CHART_PALETTE.control }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      Awaiting
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
