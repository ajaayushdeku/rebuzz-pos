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
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok)
    return {
      data: [],
      totalDiscount: 0,
      totalRedeemPoint: 0,
      totalNetProfit: 0,
    };
  const json = await res.json();
  return (
    json ?? {
      data: [],
      totalDiscount: 0,
      totalRedeemPoint: 0,
      totalNetProfit: 0,
    }
  );
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

  // Single fetch from prev month start to today covers both periods
  const monthlyData = await fetchCompareSalesByMonth(
    prevMonthStart,
    currMonthEnd,
  );

  // Filter compare-sales-by-month into current month vs previous month
  const currCompare = monthlyData.filter(
    (d) => d.monthStart >= currMonthStart && d.monthStart <= currMonthEnd,
  );
  const prevCompare = monthlyData.filter(
    (d) => d.monthStart >= prevMonthStart && d.monthStart <= prevMonthEnd,
  );

  // Single bills fetch covering both periods, then filter client-side
  const allBills = await fetchBills(prevMonthStart, currMonthEnd);
  const currBills = allBills.filter((b) =>
    isBillInRange(b, currMonthStart, currMonthEnd),
  );
  const prevBills = allBills.filter((b) =>
    isBillInRange(b, prevMonthStart, prevMonthEnd),
  );

  const currSalesByItem = await fetchSalesByItemForPeriod(
    currMonthStart,
    currMonthEnd,
  );
  const prevSalesByItem = await fetchSalesByItemForPeriod(
    prevMonthStart,
    prevMonthEnd,
  );

  // ── Revenue & Orders from compare-sales-by-month ──────────────────────────
  const aggregateCompare = (data: RawMonthCompare[]) => {
    const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
    const totalOrders = data.reduce((s, d) => s + d.totalSales, 0);
    return { revenue: totalRevenue, orders: totalOrders };
  };

  const currCompareAgg = aggregateCompare(currCompare);
  const prevCompareAgg = aggregateCompare(prevCompare);

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
