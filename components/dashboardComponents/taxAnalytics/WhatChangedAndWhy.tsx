"use client";

import { TrendingUp, TrendingDown, Info, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

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

      return { thisMonth, lastMonth, change, changePct, thisRevenue, lastRevenue };
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
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        {increased ? (
          <TrendingUp size={14} className="text-amber-500" />
        ) : (
          <TrendingDown size={14} className="text-blue-500" />
        )}
        <ComponentHeader
          title="What Changed & Why"
          subHeader="Your VAT bill this month compared to last"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="ml-2 text-sm">Loading VAT comparison...</span>
        </div>
      ) : isError || !data ? (
        <div className="py-10 text-center text-sm text-red-500">
          Couldn&apos;t load VAT comparison. Please try again.
        </div>
      ) : (
        <>
          {/* Comparison row */}
          <div className="flex items-center justify-between gap-4">
            {/* Last month */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Last Month
              </p>
              <p className="text-xl font-bold text-gray-500">
                {fmt(data.lastMonth)}
              </p>
            </div>

            {/* Change pill — center */}
            <div className="flex-1 flex justify-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  increased
                    ? "text-amber-600 bg-amber-50"
                    : "text-blue-600 bg-blue-50"
                }`}
              >
                {increased ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {fmt(Math.abs(data.change))} ({data.changePct}%)
              </div>
            </div>

            {/* This month — blue card */}
            <div className="bg-blue-600 rounded-2xl px-5 py-3 text-right min-w-[140px]">
              <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest mb-0.5">
                This Month
              </p>
              <p className="text-2xl font-bold text-white leading-none">
                {fmt(data.thisMonth)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="mt-4 flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-0.5">
                Why it changed
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {reason}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
