"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import TaxableVsNonTaxableItems from "@/components/dashboardComponents/taxAnalytics/TaxableVsNonTaxableItems";
import { useTaxableBreakdown } from "@/hooks/useTaxableBreakdown";
import { useHighestTaxItems } from "@/hooks/useHighestTaxItems";
import { useTaxByCategory } from "@/hooks/useTaxByCategory";
import HighestTaxGenerated from "@/components/dashboardComponents/taxAnalytics/HighestTaxGenerated";
import TaxByCategory from "@/components/dashboardComponents/taxAnalytics/TaxByCategory";
import TaxOnRefundedBills from "@/components/dashboardComponents/taxAnalytics/TaxOnRefundedBills";
import VatStatCard from "../dashboardComponents/taxAnalytics/VatStatCard";
import { VatStat } from "../dashboardComponents/taxAnalytics/MiniTrendChart";
import VATTrendChart from "../dashboardComponents/taxAnalytics/VATTrendChart";
import MonthlyTaxTrendChart from "../dashboardComponents/taxAnalytics/MonthlyTaxTrendChart";
import WhatChangedAndWhy from "../dashboardComponents/taxAnalytics/WhatChangedAndWhy";
import TDSOnRent from "../dashboardComponents/taxAnalytics/TDSOnRent";
import VATUnclaimedBack from "../dashboardComponents/taxAnalytics/VATUnclaimedBack";
import NoVATPurchases from "../dashboardComponents/taxAnalytics/NoVATPurchase";
import VAT20ReturnSummary from "../dashboardComponents/taxAnalytics/VAT20ReturnSummary";
import FilingCalendar from "../dashboardComponents/taxAnalytics/FilingCalendar";
import TaxReconciliation from "../dashboardComponents/taxAnalytics/TaxReconciliation";
import IncomeTaxProvision from "../dashboardComponents/taxAnalytics/IncomeTaxProvision";
import AdvanceTaxInstallments from "../dashboardComponents/taxAnalytics/AdvanceTaxInstallments";
import TDSReceivable from "../dashboardComponents/taxAnalytics/TDSReceivable";
import TaxRateBreakdown from "../dashboardComponents/taxAnalytics/TaxRateBreakdown";
import WhatYouActuallyOwe, {
  WhatYouOweData,
} from "../dashboardComponents/taxAnalytics/WhatYouActuallyOwe";
import TaxAuditLog from "../dashboardComponents/taxAnalytics/TaxAuditLog";

interface RefundBillWithTax {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return { startDate: start, endDate: end };
}

export function TaxableVsNonTaxableWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading, isError } = useTaxableBreakdown(
    effectiveStart,
    effectiveEnd,
  );

  return (
    <TaxableVsNonTaxableItems
      data={
        data || {
          taxableRevenue: 0,
          taxableTaxAmount: 0,
          nonTaxableRevenue: 0,
          taxableItems: [],
          nonTaxableItems: [],
        }
      }
      isLoading={isLoading}
      isError={isError}
    />
  );
}

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
      endDate: toLocalDateStr(new Date(y, m, 0)),
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

interface TransactionRow {
  status?: string;
  taxAmount?: number;
}

/**
 * VAT collected for a date range = the total tax charged across every
 * (non-refunded) bill — summed from each bill's total tax (`taxamt`) via the
 * order-history transactions endpoint. This is the actual tax in the bills,
 * not a flat 13% of revenue.
 */
async function fetchTaxCollected(
  startDate: string,
  endDate: string,
): Promise<number> {
  const res = await fetch(
    `/api/order-history/transactions?startDate=${startDate}&endDate=${endDate}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  const json = await res.json();
  const rows: TransactionRow[] = json?.data ?? [];

  let total = 0;
  for (const row of rows) {
    if (row?.status === "refunded") continue;
    total += Number(row?.taxAmount) || 0;
  }
  return total;
}

/**
 * VAT paid on purchases = 13% of each expense transaction summed.
 * The expense API uses month/year, so pass them directly.
 */
async function fetchExpenseVat(month: number, year: number): Promise<number> {
  const res = await fetch(`/api/expense?month=${month}&year=${year}`);
  if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`);
  const json = await res.json();
  const transactions = json?.data?.transactions ?? [];

  let totalVat = 0;
  for (const t of transactions) {
    if (t.kind === "expense") {
      // 13% VAT on each expense amount, rounded to 2 decimal places
      totalVat += Math.round(t.amount * 0.13 * 100) / 100;
    }
  }
  return totalVat;
}

/**
 * Refund tax = sum of taxRefunded across all refunded bills in the date range.
 */
async function fetchRefundTax(
  startDate: string,
  endDate: string,
): Promise<number> {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`/api/tax/refunded-bills?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch refunded bills: ${res.status}`);
  const data = await res.json();
  let total = 0;
  for (const bill of data) {
    total += Number(bill.taxRefunded) || 0;
  }
  return total;
}

/** Month-over-month change as an absolute percent + trend direction. */
function monthChange(
  current: number,
  previous: number,
): { change: number; trend: "up" | "down" } {
  if (previous > 0) {
    const pct = Math.round(((current - previous) / previous) * 1000) / 10;
    return {
      change: Math.abs(pct),
      trend: current >= previous ? "up" : "down",
    };
  }
  return { change: current > 0 ? 100 : 0, trend: "up" };
}

// No cards are locked — all use real data.
const LOCKED_CARD_IDS = new Set<string>();

export function VatStatsWrapper() {
  const ranges = getMonthRanges();

  // Static card metadata — only the overlay info (title, description) lives here.
  const CARD_META: Pick<VatStat, "id" | "title" | "description">[] = [
    {
      id: "sales",
      title: "Total Sales",
      description:
        "Total revenue this month before any deductions. Higher sales means more VAT to collect and remit.",
    },
    {
      id: "collected",
      title: "VAT Collected",
      description:
        "VAT you charged customers at 13%. This money belongs to IRD — you're holding it on their behalf.",
    },
    {
      id: "purchase",
      title: "VAT Paid On Purchases",
      description:
        "VAT you paid on purchases (supplies, rent, etc.). This offsets what you owe — the higher, the better.",
    },
    {
      id: "payable",
      title: "Net VAT Payable",
      description:
        "What you actually owe IRD = Output VAT − Input VAT − Refunds. This is your real tax bill.",
    },
  ];

  const EMPTY_STATS: VatStat[] = CARD_META.map((meta) => ({
    ...meta,
    amount: null,
    change: 0,
    trend: "up",
    chartColor: "green" as const,
    sparkline: [],
  }));

  // All four cards use real data:
  //   sales   → revenue (business report)
  //   collected → VAT from order-history transactions
  //   purchase → 13% of each expense transaction
  //   payable → collected − purchase − refund tax
  const { data } = useQuery({
    queryKey: [
      "vat-stats",
      ranges.thisMonth.startDate,
      ranges.thisMonth.endDate,
      ranges.lastMonth.startDate,
      ranges.lastMonth.endDate,
    ],
    queryFn: async () => {
      // Compute month/year directly from current date for the expense API.
      const now = new Date();
      const thisMonth = now.getMonth() + 1; // 1-indexed
      const thisYear = now.getFullYear();
      // Previous month (handle January → December of previous year)
      const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
      const lastYear = thisMonth === 1 ? thisYear - 1 : thisYear;

      const [
        thisRevenue,
        lastRevenue,
        thisTax,
        lastTax,
        thisExpenseVat,
        lastExpenseVat,
        thisRefundTax,
        lastRefundTax,
      ] = await Promise.all([
        fetchRevenue(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
        fetchRevenue(ranges.lastMonth.startDate, ranges.lastMonth.endDate),
        fetchTaxCollected(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
        fetchTaxCollected(ranges.lastMonth.startDate, ranges.lastMonth.endDate),
        fetchExpenseVat(thisMonth, thisYear),
        fetchExpenseVat(lastMonth, lastYear),
        fetchRefundTax(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
        fetchRefundTax(ranges.lastMonth.startDate, ranges.lastMonth.endDate),
      ]);
      return {
        thisRevenue,
        lastRevenue,
        thisTax,
        lastTax,
        thisExpenseVat,
        lastExpenseVat,
        thisRefundTax,
        lastRefundTax,
      };
    },
    staleTime: 60 * 1000,
  });

  const stats: VatStat[] = useMemo(() => {
    if (!data) return EMPTY_STATS;
    return CARD_META.map((meta) => {
      if (meta.id === "sales") {
        const { change, trend } = monthChange(
          data.thisRevenue,
          data.lastRevenue,
        );
        return {
          ...meta,
          amount: data.thisRevenue,
          change,
          trend,
          sparkline: [data.lastRevenue, data.thisRevenue],
          chartColor: (trend === "up" ? "green" : "red") as "green" | "red",
        };
      }
      if (meta.id === "collected") {
        const { change, trend } = monthChange(data.thisTax, data.lastTax);
        return {
          ...meta,
          amount: data.thisTax,
          change,
          trend,
          sparkline: [data.lastTax, data.thisTax],
          chartColor: (trend === "up" ? "green" : "red") as "green" | "red",
        };
      }
      if (meta.id === "purchase") {
        const { change, trend } = monthChange(
          data.thisExpenseVat,
          data.lastExpenseVat,
        );
        return {
          ...meta,
          amount: data.thisExpenseVat,
          change,
          trend,
          sparkline: [data.lastExpenseVat, data.thisExpenseVat],
          chartColor: (trend === "up" ? "green" : "red") as "green" | "red",
        };
      }
      if (meta.id === "payable") {
        // Net VAT Payable = VAT Collected − VAT Paid on Purchases − Refund Tax
        const thisPayable = Math.max(
          0,
          data.thisTax - data.thisExpenseVat - data.thisRefundTax,
        );
        const lastPayable = Math.max(
          0,
          data.lastTax - data.lastExpenseVat - data.lastRefundTax,
        );
        const { change, trend } = monthChange(thisPayable, lastPayable);
        return {
          ...meta,
          amount: thisPayable,
          change,
          trend,
          sparkline: [lastPayable, thisPayable],
          chartColor: (trend === "up" ? "red" : "green") as "red" | "green",
        };
      }
      return {
        ...meta,
        amount: null,
        change: 0,
        trend: "up",
        chartColor: "green" as const,
        sparkline: [],
      };
    });
  }, [data]);

  return (
    <div className="relative grid grid-cols-2 lg:grid lg:grid-cols-4 lg:gap-3 flex gap-3 overflow-x-auto pb-3 px-2 sm:px-0  lg:overflow-visible scrollbar-custom">
      {stats.map((card) => (
        <VatStatCard
          key={card.id}
          stat={card}
          locked={LOCKED_CARD_IDS.has(card.id)}
        />
      ))}
    </div>
  );
}

export function HighestTaxGeneratedWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading, isError } = useHighestTaxItems(
    effectiveStart,
    effectiveEnd,
  );

  return (
    <HighestTaxGenerated
      data={data ?? []}
      isLoading={isLoading}
      isError={isError}
    />
  );
}

export function TaxByCategoryWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const effectiveStart = startDate || getDefaultDateRange().startDate;
  const effectiveEnd = endDate || getDefaultDateRange().endDate;

  const { data, isLoading, isError } = useTaxByCategory(
    effectiveStart,
    effectiveEnd,
  );

  return (
    <TaxByCategory data={data ?? []} isLoading={isLoading} isError={isError} />
  );
}

export function TaxOnRefundedBillsWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [refundBills, setRefundBills] = useState<RefundBillWithTax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRefundBills = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          startDate: startDate || getDefaultDateRange().startDate,
          endDate: endDate || getDefaultDateRange().endDate,
        });
        const res = await fetch(`/api/tax/refunded-bills?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRefundBills(data);
      } catch (error) {
        console.error("Failed to fetch refunded bills:", error);
        setError(true);
        setRefundBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRefundBills();
  }, [startDate, endDate]);

  return (
    <TaxOnRefundedBills
      data={refundBills}
      isLoading={loading}
      isError={error}
    />
  );
}

export function WhatYouActuallyOweWrapper() {
  const ranges = getMonthRanges();

  // Compute month/year directly from current date for the expense API.
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const { data } = useQuery({
    queryKey: [
      "what-you-owe",
      ranges.thisMonth.startDate,
      ranges.thisMonth.endDate,
    ],
    queryFn: async () => {
      const [thisTax, thisExpenseVat, thisRefundTax] = await Promise.all([
        fetchTaxCollected(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
        fetchExpenseVat(thisMonth, thisYear),
        fetchRefundTax(ranges.thisMonth.startDate, ranges.thisMonth.endDate),
      ]);

      const thisPayable = Math.max(0, thisTax - thisExpenseVat - thisRefundTax);

      // Build a human-readable due date (e.g. "25 Falgun 2082")
      const dueDate = getDueDate();

      const result: WhatYouOweData = {
        collected: thisTax,
        inputVat: thisExpenseVat,
        refund: thisRefundTax,
        payable: thisPayable,
        dueDate,
      };
      return result;
    },
    staleTime: 60 * 1000,
  });

  return <WhatYouActuallyOwe data={data ?? fallbackWhatYouOweData} />;
}

/** Approximate the 25th of the next month in BS (Nepali) format. */
function getDueDate(): string {
  const now = new Date();
  const bsMonths = [
    "Baisakh",
    "Jestha",
    "Ashad",
    "Shrawan",
    "Bhadra",
    "Ashoj",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ];
  // Next month in BS (rough mapping: AD month + 2 ≈ BS month index)
  const nextMonthIdx = (now.getMonth() + 2) % 12;
  const bsYear = now.getFullYear() + 56; // approximate BS year
  return `25 ${bsMonths[nextMonthIdx]} ${bsYear}`;
}

const fallbackWhatYouOweData: WhatYouOweData = {
  collected: 0,
  inputVat: 0,
  refund: 0,
  payable: 0,
  dueDate: "—",
};

export function VATTrendChartWrapper() {
  return <VATTrendChart />;
}

export function MonthlyTaxTrendChartWrapper() {
  return <MonthlyTaxTrendChart />;
}

export function WhatChangedAndWhyWrapper() {
  return <WhatChangedAndWhy />;
}

export function TaxRatedBreakdownWrapper() {
  return <TaxRateBreakdown />;
}

export function TDSOnRentWrapper() {
  return <TDSOnRent />;
}

export function VATUnclaimedBackWrapper() {
  return <VATUnclaimedBack />;
}

export function NoVATPurchasesWrapper() {
  return <NoVATPurchases />;
}

export function VAT20ReturnSummaryWrapper() {
  return <VAT20ReturnSummary />;
}

export function FilingCalendarWrapper() {
  return <FilingCalendar />;
}

export function TaxReconciliationWrapper() {
  return <TaxReconciliation />;
}

export function IncomeTaxProvisionWrapper() {
  return <IncomeTaxProvision />;
}

export function AdvanceTaxInstallmentsWrapper() {
  return <AdvanceTaxInstallments />;
}

export function TDSReceivableWrapper() {
  return <TDSReceivable />;
}

export function TaxAuditLogWrapper() {
  return <TaxAuditLog />;
}
