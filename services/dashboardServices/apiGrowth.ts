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

type RawSalesItem = {
  itemName: string;
  totalRevenue: number;
  netProfit: number;
  count: number;
  category?: string | null;
};

type RawSalesByItemResponse = {
  data: RawSalesItem[];
  totalDiscount?: number;
  totalRedeemPoint?: number;
  totalNetProfit?: number;
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

// Retained for the preserved month-based comparison in getGrowthData (see the
// commented-out block there); the app may switch back to calendar months later.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function firstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    { headers: await authHeaders(), cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = await res.json();
  // console.log("Fetched bills:", { start, end, bills: json?.data?.bill ?? [] });
  // Client-side filter — ensures only bills for the exact month range are counted
  const allBills: RawBill[] = json?.data?.bill ?? [];
  return allBills.filter((b) => isBillInRange(b, start, end));
}

async function fetchCompareSalesByMonth(
  start: string,
  end: string,
  cacheBust?: number,
): Promise<RawMonthCompare[]> {
  const _t = cacheBust ?? Date.now();
  const res = await fetch(
    `${BASE}/business/report/compare-sales-by-month?startDate=${start}&endDate=${end}&_t=${_t}`,
    { headers: await authHeaders(), cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data ?? [];
}

async function fetchSalesByItemForPeriod(
  start: string,
  end: string,
): Promise<RawSalesByItemResponse> {
  const res = await fetch(
    `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
    { headers: await authHeaders(), cache: "no-store" },
  );
  if (!res.ok)
    return {
      data: [],
      totalDiscount: 0,
      totalRedeemPoint: 0,
      totalNetProfit: 0,
    };
  const json = await res.json();

  console.log("Fetched salesByItem:", { start, end, data: json?.data });
  return (
    json ?? {
      data: [],
      totalDiscount: 0,
      totalRedeemPoint: 0,
      totalNetProfit: 0,
    }
  );
}

// ── getGrowthData — 6 stat cards (current 30-day period vs previous 30 days) ─

export const getGrowthData = async (): Promise<GrowthStatsApiResponse> => {
  const today = new Date();

  // ── Rolling 30-day periods (current vs the 30 days immediately before) ────
  // Current period:  the last 30 days, ending today       (e.g. Jun 11 → Jul 10).
  // Previous period: the 30 days immediately before it     (e.g. May 12 → Jun 10).
  const currPeriodStartDate = new Date(today);
  currPeriodStartDate.setDate(today.getDate() - 29);
  const prevPeriodEndDate = new Date(today);
  prevPeriodEndDate.setDate(today.getDate() - 30);
  const prevPeriodStartDate = new Date(today);
  prevPeriodStartDate.setDate(today.getDate() - 59);

  const currPeriodStart = toDateStr(currPeriodStartDate);
  const currPeriodEnd = toDateStr(today);
  const prevPeriodStart = toDateStr(prevPeriodStartDate);
  const prevPeriodEnd = toDateStr(prevPeriodEndDate);

  console.log("Growth Data Periods:", {
    currPeriodStart,
    currPeriodEnd,
    prevPeriodStart,
    prevPeriodEnd,
  });

  /* ── Previous behavior: calendar-month comparison — intentionally preserved ─
     Kept for future use; the app may switch back to month-over-month comparisons.
       Current Month:  first day of the current month  → today.
       Previous Month: first day of the previous month → last day of previous month.

  const currPeriodStart = toDateStr(
    firstDayOfMonth(today.getFullYear(), today.getMonth()),
  );
  const currPeriodEnd = toDateStr(today);
  const prevPeriodStart = toDateStr(
    firstDayOfMonth(today.getFullYear(), today.getMonth() - 1),
  );
  const prevPeriodEnd = toDateStr(
    lastDayOfMonth(today.getFullYear(), today.getMonth() - 1),
  );
  */

  /* ── Month-bucketed revenue/orders source — preserved for calendar-month mode ─
     compare-sales-by-month returns whole-month buckets keyed by `monthStart`
     (the 1st of each month). Filtering those buckets by an arbitrary rolling
     window mis-attributes data (it drops the partial current/previous month),
     which is why the numbers looked stale after the date range changed.
     Revenue & orders are now derived from the exact-range bills below instead.
     Re-enable this when switching back to calendar-month comparisons.

  const monthlyData = await fetchCompareSalesByMonth(
    prevPeriodStart,
    currPeriodEnd,
  );
  const currCompare = monthlyData.filter(
    (d) => d.monthStart >= currPeriodStart && d.monthStart <= currPeriodEnd,
  );
  const prevCompare = monthlyData.filter(
    (d) => d.monthStart >= prevPeriodStart && d.monthStart <= prevPeriodEnd,
  );
  */

  // Single bills fetch covering both periods, then filter client-side
  const allBills = await fetchBills(prevPeriodStart, currPeriodEnd);
  const currBills = allBills.filter((b) =>
    isBillInRange(b, currPeriodStart, currPeriodEnd),
  );
  const prevBills = allBills.filter((b) =>
    isBillInRange(b, prevPeriodStart, prevPeriodEnd),
  );

  console.log("Fetched bills:", {
    currBillsCount: currBills.length,
    prevBillsCount: prevBills.length,
  });

  const currSalesByItem = await fetchSalesByItemForPeriod(
    currPeriodStart,
    currPeriodEnd,
  );
  const prevSalesByItem = await fetchSalesByItemForPeriod(
    prevPeriodStart,
    prevPeriodEnd,
  );

  // ── Revenue & Orders from the exact-range bills (accurate for rolling windows) ─
  const aggregateBills = (bills: RawBill[]) => {
    const nonRefunded = bills.filter((b) => !b.isRefunded);
    const revenue = nonRefunded.reduce((s, b) => s + (b.grandTotal ?? 0), 0);
    const orders = nonRefunded.length;
    return { revenue, orders };
  };

  const currCompareAgg = aggregateBills(currBills);
  const prevCompareAgg = aggregateBills(prevBills);

  /* Previous (month-bucket) aggregation — preserved for calendar-month mode:
  const aggregateCompare = (data: RawMonthCompare[]) => {
    const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
    const totalOrders = data.reduce((s, d) => s + d.totalSales, 0);
    return { revenue: totalRevenue, orders: totalOrders };
  };
  const currCompareAgg = aggregateCompare(currCompare);
  const prevCompareAgg = aggregateCompare(prevCompare);
  */

  // ── Profit Margin from salesByItem ────────────────────────────────────────
  const getNetProfit = (res: RawSalesByItemResponse) => {
    return (
      (res.totalNetProfit ?? 0) -
      (res.totalDiscount ?? 0) -
      (res.totalRedeemPoint ?? 0)
    );
  };

  const currNetProfit = getNetProfit(currSalesByItem);
  const prevNetProfit = getNetProfit(prevSalesByItem);

  // ── Refund rate & customer growth from bills (keep current way) ──────────
  const calcBillStats = (bills: RawBill[]) => {
    const nonRefunded = bills.filter((b) => !b.isRefunded);
    const refunded = bills.filter((b) => b.isRefunded);

    const refundRate =
      bills.length > 0
        ? Math.round((refunded.length / bills.length) * 10000) / 100
        : 0;

    const uniqueCustomers = new Set(
      nonRefunded.filter((b) => b.customerId).map((b) => b.customerId),
    ).size;

    return { refundRate, uniqueCustomers };
  };

  const currBillStats = calcBillStats(currBills);
  const prevBillStats = calcBillStats(prevBills);

  // ── Derived stats ────────────────────────────────────────────────────────
  const currRevenue = currCompareAgg.revenue;
  const prevRevenue = prevCompareAgg.revenue;
  const currOrders = currCompareAgg.orders;
  const prevOrders = prevCompareAgg.orders;

  const currAvgOrder =
    currOrders > 0 ? Math.round((currRevenue / currOrders) * 100) / 100 : 0;
  const prevAvgOrder =
    prevOrders > 0 ? Math.round((prevRevenue / prevOrders) * 100) / 100 : 0;

  const currMargin =
    currRevenue > 0
      ? Math.round((currNetProfit / currRevenue) * 10000) / 100
      : 0;
  const prevMargin =
    prevRevenue > 0
      ? Math.round((prevNetProfit / prevRevenue) * 10000) / 100
      : 0;

  const pct = (c: number, p: number): number => {
    if (p === 0) return c > 0 ? 100 : 0;
    return Math.round(((c - p) / Math.abs(p)) * 1000) / 10;
  };

  return {
    revenue: {
      value: Math.round(currRevenue * 100) / 100,
      prev: Math.round(prevRevenue * 100) / 100,
      percent: pct(currRevenue, prevRevenue),
    },
    orders: {
      value: currOrders,
      prev: prevOrders,
      percent: pct(currOrders, prevOrders),
    },
    avgOrder: {
      value: currAvgOrder,
      prev: prevAvgOrder,
      percent: pct(currAvgOrder, prevAvgOrder),
    },
    customers: {
      value: currBillStats.uniqueCustomers,
      prev: prevBillStats.uniqueCustomers,
      percent: pct(
        currBillStats.uniqueCustomers,
        prevBillStats.uniqueCustomers,
      ),
    },
    margin: {
      value: currMargin,
      prev: prevMargin,
      percent: pct(currMargin, prevMargin),
    },
    refunds: {
      value: currBillStats.refundRate,
      prev: prevBillStats.refundRate,
      percent: pct(currBillStats.refundRate, prevBillStats.refundRate),
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

  // ── Cache-bust: unique timestamp per invocation ──────────────────────────
  const _ts = Date.now();

  // Fetch compare-sales-by-month for each year range
  const [thisYearMonthly, lastYearMonthly] = await Promise.all([
    fetchCompareSalesByMonth(thisYearStart, thisYearEnd, _ts),
    fetchCompareSalesByMonth(lastYearStart, lastYearEnd, _ts + 1),
  ]);

  // console.log("Fetched YoY data:", { thisYearMonthly, lastYearMonthly });

  // Filter to keep only entries matching the expected year
  const filterByYear = (data: RawMonthCompare[], targetYear: number) =>
    data.filter((d) => {
      const dYear = new Date(d.monthStart + "T00:00:00").getFullYear();
      return dYear === targetYear;
    });

  const filteredThisYear = filterByYear(thisYearMonthly, year);
  const filteredLastYear = filterByYear(lastYearMonthly, year - 1);

  // Build maps: month label → revenue
  const buildRevenueMap = (data: RawMonthCompare[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (const m of data) {
      const label = monthLabel(new Date(m.monthStart + "T00:00:00"));
      map.set(label, m.totalRevenue);
    }
    return map;
  };

  const thisMap = buildRevenueMap(filteredThisYear);
  const lastMap = buildRevenueMap(filteredLastYear);

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
