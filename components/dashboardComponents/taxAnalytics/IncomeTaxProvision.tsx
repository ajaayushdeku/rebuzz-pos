"use client";

import { Info, ArrowRight, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip as HintTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { TaxFigureCardSkeleton } from "./TaxAnalyticsSkeletons";

// Statutory corporate income tax rate (Nepal). This is a government rate, not a
// business metric — no API provides it, so it's a fixed constant.
const ANNUAL_TAX_RATE = 25; // %

interface ProfitTrendRow {
  month: string;
  grossRevenue: number;
  netProfit: number;
}

/**
 * 12-month net-profit series from the profit-trend endpoint. The last entry is
 * the current month (month-to-date); the sum is the trailing-12-month profit.
 */
async function fetchProfitTrend(): Promise<ProfitTrendRow[]> {
  const res = await fetch("/api/profit-trend");
  if (!res.ok) throw new Error(`Failed to fetch profit trend: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as ProfitTrendRow[];
}

/**
 * One figure in the card. The card keeps its dark treatment — it is the
 * working-out behind a number the owner has to set money aside for, so it is
 * deliberately the one card on the page that reads as a panel rather than a
 * report. Hence the tiles here are dark rather than the shared white ones.
 */
function Figure({
  label,
  value,
  note,
  tone = "plain",
  size = "md",
}: {
  label: string;
  value: string;
  note: string;
  /** `good` is the money kept, `warn` the money to put aside. */
  tone?: "plain" | "good" | "warn";
  size?: "md" | "lg";
}) {
  const box =
    tone === "good"
      ? "border border-emerald-800/50 bg-emerald-900/40"
      : "bg-gray-800";
  const figure =
    tone === "good"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-white";
  const noteColor = tone === "good" ? "text-emerald-600" : "text-gray-500";

  return (
    <div className={`flex-1 rounded-xl px-4 py-3.5 ${box}`}>
      <p
        className={`mb-1.5 text-[11px] ${
          tone === "good" ? "text-emerald-400" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`font-semibold tracking-tight tabular-nums ${figure} ${
          size === "lg" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-[11px] ${noteColor}`}>{note}</p>
    </div>
  );
}

export default function IncomeTaxProvision() {
  const { currency } = useCurrency();
  const fmtRs = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["income-tax-provision"],
    queryFn: fetchProfitTrend,
    staleTime: 5 * 60 * 1000,
  });

  // Derive the provision figures. Income tax applies to profit, not losses, so
  // the taxable base is clamped at 0.
  const rate = ANNUAL_TAX_RATE / 100;
  const netProfitPreTax = data?.length ? data[data.length - 1].netProfit : 0;
  const annualNetProfit = (data ?? []).reduce((s, m) => s + m.netProfit, 0);

  const netProfitAfterTax =
    netProfitPreTax - Math.max(0, netProfitPreTax) * rate;
  const annualProvision = Math.max(0, annualNetProfit) * rate;
  const monthlyAccrual = annualProvision / 12;

  const note = `Income tax is calculated annually but provisioned monthly. Setting aside about ${fmtRs(
    monthlyAccrual,
  )} each month keeps you covered — your actual payment is made in advance installments or at year-end filing.`;

  return (
    // The dark card of the page: same frame and header layout as the shared
    // ChartCard, in the dark scheme this card has always used.
    <div className="relative w-full rounded-2xl bg-gray-900 px-6 pb-5 pt-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
            <Landmark size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-[15px] font-normal text-white">
              <span className="truncate">Income Tax Provision</span>
              <HintTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="How to read Income Tax Provision"
                    className="flex cursor-help items-center rounded-full text-gray-500 outline-none transition-colors hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Info size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="max-w-64">
                  <p className="font-semibold">Reading this card</p>
                  {/* From the profit-trend endpoint and the constant above. */}
                  <p className="mt-1 leading-relaxed opacity-80">
                    An estimate at Nepal&apos;s {ANNUAL_TAX_RATE}% corporate
                    rate, not a filed figure. Net profit (pre-tax) is this month
                    to date; the annual provision is {ANNUAL_TAX_RATE}% of the
                    last 12 months of profit, and the monthly accrual is that
                    spread over twelve. Months at a loss are treated as zero tax
                    rather than a refund. It ignores the date range at the top
                    of the page.
                  </p>
                </TooltipContent>
              </HintTooltip>
            </h3>
            <p className="mt-0.5 text-xs tracking-wide text-gray-400">
              Annual income tax estimate based on current month profit — accrued
              monthly for accurate reporting
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TaxFigureCardSkeleton />
      ) : isError ? (
        <p className="py-10 text-center text-sm text-red-400">
          Couldn&apos;t load income tax provision. Please try again.
        </p>
      ) : (
        <>
          {/* Top row — the calculation, left to right */}
          <div className="flex items-stretch gap-3">
            <Figure
              label="Net profit (pre-tax)"
              value={fmtRs(netProfitPreTax)}
              note="This month's earnings before tax"
            />

            {/* Arrow + rate */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1">
              <p className="text-xs tabular-nums text-gray-400">
                ×{ANNUAL_TAX_RATE}%
              </p>
              <ArrowRight size={16} className="text-gray-500" />
            </div>

            <Figure
              label="Annual tax rate"
              value={`${ANNUAL_TAX_RATE}%`}
              note="Corporate income tax rate"
              size="lg"
            />

            {/* Arrow */}
            <div className="flex shrink-0 items-center justify-center px-1">
              <ArrowRight size={16} className="text-gray-500" />
            </div>

            <Figure
              label="Net profit (after tax)"
              value={fmtRs(netProfitAfterTax)}
              note="What you actually keep"
              tone="good"
            />
          </div>

          {/* Bottom row — what to set aside */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Figure
              label="Annual provision"
              value={fmtRs(annualProvision)}
              note="Estimated tax on the last 12 months of profit"
            />
            <Figure
              label="Monthly accrual"
              value={fmtRs(monthlyAccrual)}
              note="Set aside each month to avoid surprises"
              tone="warn"
            />
          </div>

          {/* Info note */}
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-800/60 px-4 py-3">
            <Info size={13} className="mt-0.5 shrink-0 text-gray-500" />
            <p className="text-[11px] leading-relaxed text-gray-400">{note}</p>
          </div>
        </>
      )}
    </div>
  );
}
