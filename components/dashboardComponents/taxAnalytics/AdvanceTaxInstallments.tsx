"use client";

import { Calendar, CheckCircle2, CalendarClock } from "lucide-react";
import { mockAdvanceTaxInstallments } from "@/lib/mockData/mock-tax-data";
import type { InstallmentStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "../chartCard";

const STATUS_CONFIG: Record<
  InstallmentStatus,
  { badge: string; badgeStyle: string; rightContent: "paid" | "awaiting" }
> = {
  paid: {
    badge: "Paid",
    badgeStyle:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300",
    rightContent: "paid",
  },
  pending: {
    badge: "Pending",
    badgeStyle:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300",
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
      <div className="border-t border-[#e8eaed] dark:border-white/10">
        {installments.map((inst) => {
          const cfg = STATUS_CONFIG[inst.status];
          const isPaid = inst.status === "paid";

          return (
            <div
              key={inst.id}
              className="flex items-center justify-between gap-4 border-b py-3.5 last:border-0 border-[#e8eaed] dark:border-white/10"
            >
              {/* Left — period + badges + due date */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                    {inst.period}
                  </span>

                  {/* Paid so far pill */}
                  <span className="rounded-full border px-2 py-0.5 text-[10px] tabular-nums border-[#dadce0] dark:border-white/15 text-[#5f6368] dark:text-[#a9b4c7]">
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

                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                  <Calendar size={11} />
                  <span>Due: {inst.dueDate}</span>
                </div>
              </div>

              {/* Right — estimated amount + paid / awaiting */}
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p className="mb-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                    Est. amount
                  </p>
                  <p className="text-[13px] font-medium tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                    {fmt(inst.estimatedAmount)}
                  </p>
                </div>

                {isPaid ? (
                  <div className="flex min-w-[100px] items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 dark:bg-emerald-400/10 dark:border-emerald-400/25">
                    <CheckCircle2
                      size={13}
                      className="text-green-600 dark:text-emerald-400"
                    />
                    <span className="text-xs tabular-nums text-green-700 dark:text-emerald-300">
                      {fmt(inst.actualPaid ?? 0)}
                    </span>
                  </div>
                ) : (
                  <div className="min-w-[100px] rounded-xl border px-4 py-1.5 text-center border-[#dadce0] dark:border-white/15">
                    <span className="text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
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
