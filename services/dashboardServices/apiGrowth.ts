import { TargetActualData } from "@/components/dashboardComponents/overviewDash/growthtracker/TargetVsActualChart";
import { YoYData } from "@/components/dashboardComponents/overviewDash/growthtracker/YearOverYearChart";
import { GrowthStatsApiResponse } from "@/lib/dashboardstats";
import { authHeaders } from "../authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────

type RawBill = {
  grandTotal?: number;
  costPrice?: number;
  isRefunded?: boolean;
  customerId?: string | null;
  paidAt?: string;
  createdAt?: string;
};

type RawMonthCompare = {
  monthStart: string;
  totalRevenue: number;
  totalSales: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function firstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

// ── Date helpers for filtering bills client-side ──────────────────────────

function parseBillDate(bill: RawBill): Date | null {
  const raw = bill.paidAt ?? bill.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function isBillInRange(
  bill: RawBill,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const d = parseBillDate(bill);
  if (!d) return false;
  return (
    d >= new Date(rangeStart + "T00:00:00") &&
    d <= new Date(rangeEnd + "T23:59:59")
  );
}

async function fetchBills(start: string, end: string): Promise<RawBill[]> {
  const res = await fetch(
    `${BASE}/business/ticket/bills?startDate=${start}&endDate=${end}&limit=5000`,
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  // Client-side filter — ensures only bills for the exact month range are counted
  const allBills: RawBill[] = json?.data?.bill ?? [];
  return allBills.filter((b) => isBillInRange(b, start, end));
}

async function fetchCompareSalesByMonth(
  start: string,
  end: string,
): Promise<RawMonthCompare[]> {
  const res = await fetch(
    `${BASE}/business/report/compare-sales-by-month?startDate=${start}&endDate=${end}`,
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  console.log("Raw compare-sales-by-month response:", json);
  return json?.data ?? [];
}

// ── getGrowthData — 6 stat cards (current month vs last month) ────────────

export const getGrowthData = async (): Promise<GrowthStatsApiResponse> => {
  const today = new Date();
  const currMonthStart = toDateStr(
    firstDayOfMonth(today.getFullYear(), today.getMonth()),
  );
  const currMonthEnd = toDateStr(today);
  const prevMonthStart = toDateStr(
    firstDayOfMonth(today.getFullYear(), today.getMonth() - 1),
  );
  const prevMonthEnd = toDateStr(
    lastDayOfMonth(today.getFullYear(), today.getMonth() - 1),
  );

  const [currBills, prevBills] = await Promise.all([
    fetchBills(currMonthStart, currMonthEnd),
    fetchBills(prevMonthStart, prevMonthEnd),
  ]);

  console.log("Current month bills:", currBills);
  console.log("Previous month bills:", prevBills);

  const calc = (bills: RawBill[]) => {
    const nonRefunded = bills.filter((b) => !b.isRefunded);
    const refunded = bills.filter((b) => b.isRefunded);

    console.log("Refunded bills:", refunded);

    // Revenue & Net Profit
    const revenue = nonRefunded.reduce((s, b) => s + (b.grandTotal ?? 0), 0);
    const cost = nonRefunded.reduce((s, b) => s + (b.costPrice ?? 0), 0);
    const netProfit = revenue - cost;

    // Orders (number of non-refunded bills)
    const orders = nonRefunded.length;

    // Avg Order Value
    const avgOrder =
      orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0;

    // Profit Margin (net profit / revenue)
    const margin =
      revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0;

    // Refund Rate (% of all bills that are refunded)
    const refundCount = refunded.length;
    const refundRate =
      bills.length > 0
        ? Math.round((refundCount / bills.length) * 10000) / 100
        : 0;

    // Customer Growth (unique non-null customerIds)
    const uniqueCustomers = new Set(
      nonRefunded.filter((b) => b.customerId).map((b) => b.customerId),
    ).size;

    return { revenue, orders, avgOrder, margin, refundRate, uniqueCustomers };
  };

  const curr = calc(currBills);
  const prev = calc(prevBills);

  const pct = (c: number, p: number): number => {
    if (p === 0) return c > 0 ? 100 : 0;
    return Math.round(((c - p) / p) * 1000) / 10;
  };

  return {
    revenue: {
      value: Math.round(curr.revenue * 100) / 100,
      prev: Math.round(prev.revenue * 100) / 100,
      percent: pct(curr.revenue, prev.revenue),
    },
    orders: {
      value: curr.orders,
      prev: prev.orders,
      percent: pct(curr.orders, prev.orders),
    },
    avgOrder: {
      value: curr.avgOrder,
      prev: prev.avgOrder,
      percent: pct(curr.avgOrder, prev.avgOrder),
    },
    customers: {
      value: curr.uniqueCustomers,
      prev: prev.uniqueCustomers,
      percent: pct(curr.uniqueCustomers, prev.uniqueCustomers),
    },
    margin: {
      value: curr.margin,
      prev: prev.margin,
      percent: pct(curr.margin, prev.margin),
    },
    refunds: {
      value: curr.refundRate,
      prev: prev.refundRate,
      percent: pct(curr.refundRate, prev.refundRate),
    },
  };
};

// ── getTargetActualData — Jan–Dec of current year ─────────────────────────

export const getTargetActualData = async (): Promise<TargetActualData[]> => {
  const today = new Date();
  const year = today.getFullYear();

  const yearStart = toDateStr(new Date(year, 0, 1)); // Jan 1
  const yearEnd = toDateStr(today); // today

  const monthlyData = await fetchCompareSalesByMonth(yearStart, yearEnd);

  // Build a map: "Jan" → revenue
  const revenueMap = new Map<string, number>();
  for (const m of monthlyData) {
    const label = monthLabel(new Date(m.monthStart + "T00:00:00"));
    revenueMap.set(label, m.totalRevenue);
  }

  // All 12 months — future months get 0 actual
  const ALL_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return ALL_MONTHS.map((month) => ({
    month,
    actual: Math.round((revenueMap.get(month) ?? 0) * 100) / 100,
    target: 0, // targets come from localStorage on the client
  }));
};

// ── getYoYData — Jan–Dec, this year vs last year ──────────────────────────

export const getYoYData = async (): Promise<YoYData[]> => {
  const today = new Date();
  const year = today.getFullYear();

  const thisYearStart = toDateStr(new Date(year, 0, 1));
  const thisYearEnd = toDateStr(today);
  const lastYearStart = toDateStr(new Date(year - 1, 0, 1));
  const lastYearEnd = toDateStr(new Date(year - 1, 11, 31));

  // Fetch raw bills for each year range — this endpoint properly filters by date
  const [thisYearBills, lastYearBills] = await Promise.all([
    fetchBills(thisYearStart, thisYearEnd),
    fetchBills(lastYearStart, lastYearEnd),
  ]);

  // Aggregate revenue by month label for each year
  const aggregateByMonth = (
    bills: RawBill[],
    targetYear: number,
  ): Map<string, number> => {
    const map = new Map<string, number>();
    for (const bill of bills) {
      // Only count non-refunded bills
      if (bill.isRefunded) continue;
      const date = new Date(bill.paidAt ?? bill.createdAt ?? "");
      // Safety check: ensure the bill's year matches the expected year
      if (date.getFullYear() !== targetYear) continue;
      const label = monthLabel(date);
      map.set(label, (map.get(label) ?? 0) + (bill.grandTotal ?? 0));
    }
    return map;
  };

  const thisMap = aggregateByMonth(thisYearBills, year);
  const lastMap = aggregateByMonth(lastYearBills, year - 1);

  const ALL_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return ALL_MONTHS.map((month) => ({
    month,
    thisYear: Math.round((thisMap.get(month) ?? 0) * 100) / 100,
    lastYear: Math.round((lastMap.get(month) ?? 0) * 100) / 100,
  }));
};
