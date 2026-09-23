"use client";

import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";
import { TaxComparisonSkeleton } from "./TaxAnalyticsSkeletons";

const VAT_RATE = 0.13; // 13% VAT

/** Local YYYY-MM-DD (no UTC shift). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** This month (month-to-date) and the full previous month. */
function getMonthRanges() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  return {
    thisMonth: {
      startDate: toLocalDateStr(new Date(y, m, 1)),
      endDate: toLocalDateStr(now),
    },
    lastMonth: {
      startDate: toLocalDateStr(new Date(y, m - 1, 1)),
      endDate: toLocalDateStr(new Date(y, m, 0)), // last day of previous month
    },
  };
}

/** Total revenue for a date range via the business report proxy. */
async function fetchRevenue(
  startDate: string,
  endDate: string,
): Promise<number> {
  const res = await fetch(
    `/api/report?startDate=${startDate}&endDate=${endDate}&limit=25`,
  );
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
  const json = await res.json();
  return Number(json?.data?.report?.totalRevenue ?? 0);
}

export default function WhatChangedAndWhy() {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const ranges = getMonthRanges();

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "vat-comparison",
      ranges.thisMonth.startDate,
      ranges.thisMonth.endDate,
      ranges.lastMonth.startDate,
      ranges.lastMonth.endDate,
    ],
    queryFn: async () => {
      // Both months in parallel — sales revenue → 13% VAT.
      const [thisRevenue, lastRevenue] = await Promise.all([
        fetchRevenue(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
        fetchRevenue(ranges.lastMonth.startDate, ranges.lastMonth.endDate),
      ]);

      const thisMonth = thisRevenue * VAT_RATE;
      const lastMonth = lastRevenue * VAT_RATE;
      const change = thisMonth - lastMonth;
      const changePct =
        lastMonth > 0
          ? Math.round((change / lastMonth) * 1000) / 10
          : thisMonth > 0
            ? 100
            : 0;

      return {
        thisMonth,
        lastMonth,
        change,
        changePct,
        thisRevenue,
        lastRevenue,
      };
    },
    staleTime: 60 * 1000,
  });

  const increased = (data?.change ?? 0) > 0;

  // Human-readable explanation derived from the revenue movement.
  const reason = (() => {
    if (!data) return "";
    const revDelta = data.thisRevenue - data.lastRevenue;
    if (data.lastMonth === 0) {
      return `This is the first month with recorded taxable sales. VAT is charged at 13% on ${fmt(
        data.thisRevenue,
      )} of sales.`;
    }
    if (revDelta > 0) {
      return `Higher sales this month (${fmt(
        revDelta,
      )} more) generated more taxable transactions at 13% VAT, raising your VAT bill.`;
    }
    if (revDelta < 0) {
      return `Lower sales this month (${fmt(
        Math.abs(revDelta),
      )} less) meant fewer taxable transactions at 13% VAT, reducing your VAT bill.`;
    }
    return "Sales held steady versus last month, so your 13% VAT bill is largely unchanged.";
  })();

  return (
    <ChartCard
      icon={increased ? TrendingUp : TrendingDown}
      // Amber when the bill grew, blue when it shrank: Tailwind's 600 / 200 / 50.
      iconColor={increased ? "#d97706" : "#2563eb"}
      iconBorder={increased ? "#fde68a" : "#bfdbfe"}
      iconBg={increased ? "#fffbeb" : "#eff6ff"}
      title="What Changed & Why"
      info={{
        heading: "Reading this card",
        // From the query above: 13% of total revenue, month to date.
        body: "An estimate, not your filed figure: it takes total sales for each month from the sales report and charges 13% VAT on all of it. This month runs from the 1st to today, so it is compared against a full previous month. It ignores the date range at the top of the page, and it does not use the tax actually charged on each bill.",
      }}
      subtitle="Your VAT bill this month compared to last"
    >
      {isLoading ? (
        <TaxComparisonSkeleton />
      ) : isError || !data ? (
        <p
          className="py-10 text-center text-sm"
          style={{ color: CHART_PALETTE.bad }}
        >
          Couldn&apos;t load VAT comparison. Please try again.
        </p>
      ) : (
        <>
          {/* Comparison row */}
          <div className="flex items-center justify-between gap-4">
            {/* Last month */}
            <div>
              <p
                className="mb-1 text-[11px]"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Last month
              </p>
              <p
                className="text-xl font-semibold tracking-tight tabular-nums"
                style={{ color: CHART_PALETTE.axis }}
              >
                {fmt(data.lastMonth)}
              </p>
            </div>

            {/* Change pill — center */}
            <div className="flex flex-1 justify-center">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs tabular-nums"
                style={{
                  borderColor: CHART_PALETTE.control,
                  color: increased ? CHART_PALETTE.warn : CHART_PALETTE.blue,
                }}
              >
                {increased ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {fmt(Math.abs(data.change))} ({data.changePct}%)
              </span>
            </div>

            {/* This month — blue card */}
            <div className="min-w-[140px] rounded-2xl bg-blue-600 px-5 py-3 text-right">
              <p className="mb-0.5 text-[11px] text-blue-100">This month</p>
              <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-white">
                {fmt(data.thisMonth)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5"
            style={{ borderColor: CHART_PALETTE.border }}
          >
            <Info
              size={13}
              className="mt-0.5 shrink-0"
              style={{ color: CHART_PALETTE.subtitle }}
            />
            <div>
              <p
                className="mb-0.5 text-[11px] font-medium"
                style={{ color: CHART_PALETTE.title }}
              >
                Why it changed
              </p>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: CHART_PALETTE.axis }}
              >
                {reason}
              </p>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
