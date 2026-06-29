import { StatsApiResponse, WinningApiResponse } from "@/lib/dashboardstats";
import { authHeaders } from "../authServices/session";
import { TopProduct } from "@/components/dashboardComponents/overviewDash/TopItems";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import { RawBillListResponse } from "@/lib/types/bill";
import { DataPoint } from "@/lib/types/chart";
import { CategorySalesData } from "@/components/dashboardComponents/overviewDash/SalesCategoryChart";
import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { cookies } from "next/headers";
import { getWeekDateRange } from "@/lib/config/weeklyDateRange";
import { formatHourlyData } from "@/utils/formatHourReportToday";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/** Safely parse a fetch response as JSON, returning null on any failure
 * (network error, non-OK status, or non-JSON body such as an HTML error page). */
const safeJson = async <T = unknown>(res: Response): Promise<T | null> => {
  try {
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

/** Map a compare type to the backend endpoint path segment */
const compareEndpoint = (type: "date" | "week" | "month" | "year"): string => {
  switch (type) {
    case "date":
      return "compare-sales-by-date";
    case "week":
      return "compare-sales-by-week";
    case "month":
      return "compare-sales-by-month";
    case "year":
      return "compare-sales-by-year";
  }
};

export const getStatsData = async (
  startDateStr?: string,
  endDateStr?: string,
  compareType: "date" | "week" | "month" | "year" = "date",
): Promise<StatsApiResponse> => {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 30);

  const start = startDateStr ?? defaultStart.toISOString().split("T")[0];
  const end = endDateStr ?? today.toISOString().split("T")[0];

  const headers = await authHeaders();

  // Unique per-invocation timestamp to prevent server-side dedup of
  // concurrent current/previous period requests
  const _ts = Date.now();

  const [compareRes, salesByItemRes, reportRes] = await Promise.all([
    fetch(
      `${BASE}/business/report/${compareEndpoint(compareType)}?startDate=${start}&endDate=${end}&_t=${_ts}`,
      { headers, cache: "no-store" },
    ),
    fetch(
      `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}&_t=${_ts + 1}`,
      { headers, cache: "no-store" },
    ),
    fetch(
      `${BASE}/business/report?startDate=${start}&endDate=${end}&_t=${_ts + 2}`,
      { headers, cache: "no-store" },
    ),
  ]);

  // Aggregate daily/weekly/monthly/yearly compare-sales data
  const compareJson = await safeJson<{
    data?: { totalSales: number; totalRevenue: number }[];
  }>(compareRes);
  const dataPoints: { totalSales: number; totalRevenue: number }[] =
    compareJson?.data ?? [];
  const totalOrders = dataPoints.reduce(
    (sum, d) => sum + (d.totalSales ?? 0),
    0,
  );
  const totalRevenue = dataPoints.reduce(
    (sum, d) => sum + (d.totalRevenue ?? 0),
    0,
  );

  // Get total products sold from salesByItem data
  const salesByItemJson = await safeJson<{ data?: { count: number }[] }>(
    salesByItemRes,
  );
  const salesItems: { count: number }[] = salesByItemJson?.data ?? [];
  const totalProductsSold = salesItems.reduce(
    (sum, item) => sum + (item.count ?? 0),
    0,
  );

  // Get net profit from the /business/report endpoint (direct profit figure)
  const reportJson = await safeJson<{
    data?: { report?: { profit?: number } };
  }>(reportRes);
  const netProfit: number = reportJson?.data?.report?.profit ?? 0;

  //  netProfit =
  //   salesItems.reduce((sum, item) => sum + (item.netProfit ?? 0), 0) -
  //   (salesByItemJson.totalDiscount ?? 0) -
  //   (salesByItemJson.totalRedeemPoint ?? 0);

  return {
    totalSales: { value: totalRevenue, percent: 0 },
    totalOrders: { value: totalOrders, percent: 0 },
    productsSold: { value: totalProductsSold, percent: 0 },
    netProfit: { value: netProfit, percent: 0 },
  };
};

// Fetch the WinningStats by using other api to get specific data
export const getWinningStats = async (): Promise<WinningApiResponse> => {
  const [topProducts, hourlyData, weeklyData] = await Promise.all([
    getTopProducts(),
    getHourlySalesData(),
    getWeeklyRevenueData(),
  ]);

  // ── Top selling product ──────────────────────────────────────────────────
  const topSellingProduct = topProducts[0]?.productName ?? "No sales yet";

  // Footer: how much more volume #1 sold compared to #2.
  const topSellingFooter = (() => {
    const first = topProducts[0];
    const second = topProducts[1];
    if (!first || !second || second.noOfSale <= 0) {
      return "No comparison available";
    }
    const pct = ((first.noOfSale - second.noOfSale) / second.noOfSale) * 100;
    return `${pct.toFixed(1)}% more volume than #2`;
  })();

  // ── Peak hour — highest revenue hour ────────────────────────────────────
  const peakHourData = hourlyData.reduce(
    (peak, curr) => (curr.revenue > peak.revenue ? curr : peak),
    { hour: "N/A", revenue: 0 },
  );

  const formatPeakHourRange = (hour: string): string => {
    if (hour === "N/A") return "No data";
    const match = hour.match(/^(\d+)(AM|PM)$/);
    if (!match) return hour;
    const num = parseInt(match[1]);
    const period = match[2];
    let nextNum = num + 1;
    let nextPeriod = period;
    if (num === 11 && period === "AM") {
      nextNum = 12;
      nextPeriod = "PM";
    } else if (num === 12 && period === "PM") {
      nextNum = 1;
      nextPeriod = "AM";
    } else if (nextNum === 13) {
      nextNum = 1;
    }
    return `${hour} - ${nextNum}${nextPeriod}`;
  };

  const peakHour =
    peakHourData.revenue > 0
      ? formatPeakHourRange(peakHourData.hour)
      : "No sales today";

  // ── Best day — highest revenue day of the week ───────────────────────────
  const bestDayData = weeklyData.reduce(
    (best, curr) => (curr.revenue > best.revenue ? curr : best),
    { day: "N/A", revenue: 0 },
  );

  const bestDay =
    bestDayData.revenue > 0 ? bestDayData.day : "No sales this week";

  // Footer: how much the best day exceeds the average across all 7 days.
  const bestDayFooter = (() => {
    if (weeklyData.length === 0 || bestDayData.revenue <= 0) {
      return "No comparison available";
    }
    const totalRevenue = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
    const dailyMean = totalRevenue / weeklyData.length;
    if (dailyMean <= 0) {
      return "No comparison available";
    }
    const pct = ((bestDayData.revenue - dailyMean) / dailyMean) * 100;
    return `Avg ${pct.toFixed(1)}% above daily mean`;
  })();

  // ── Sales streak — consecutive days with sales (min 2) ───────────────────
  const salesStreak = (() => {
    // Walk backwards from the most recent day, counting consecutive days with revenue > 0
    let streak = 0;
    let streakRevenue = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].revenue > 0) {
        streak++;
        streakRevenue += weeklyData[i].revenue;
      } else {
        break;
      }
    }
    if (streak >= 2) {
      return {
        value: `${streak} days`,
        footer: `Generated $${Math.round(streakRevenue).toLocaleString()} over the last ${streak} days!`,
      };
    }
    return {
      value: "0 days",
      footer: "No active sales streak",
    };
  })();

  return {
    topSellingProduct: { value: topSellingProduct, footer: topSellingFooter },
    peakHour: { value: peakHour },
    bestDay: { value: bestDay, footer: bestDayFooter },
    salesStreak: salesStreak,
  };
};

// Fetch Top/Popular Products of the Day (Today)
export const getTopProducts = async (): Promise<TopProduct[]> => {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date().toISOString().split("T")[0];

  // console.log(
  //   `[getTopProducts] Fetching top products for date: ${startDate} to ${endDate}`,
  // );

  // Step 1: Check the business report for the date range. If `allBills` is
  // empty, there's nothing to rank — bail out early without hitting the
  // heavier salesByItem endpoint.
  const reportCheckUrl = `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=25`;
  const reportCheckRes = await fetch(reportCheckUrl, {
    headers: await authHeaders(),
    cache: "no-store",
  });

  // Response shape: { data: { report: { allBills: [...] } } }
  const reportCheckJson = await safeJson<{
    data?: { report?: { allBills?: unknown[] } };
  }>(reportCheckRes);
  // console.log("REPORT TODAY:", reportCheckJson);

  const allBills = reportCheckJson?.data?.report?.allBills;
  const hasReportData = Array.isArray(allBills) && allBills.length > 0;

  // console.log(
  //   "Has Report Data:",
  //   hasReportData,
  //   "allBills count:",
  //   allBills?.length,
  // );

  if (!hasReportData) {
    console.log(
      "[getTopProducts] Report returned empty data — skipping salesByItem.",
    );
    return [];
  }

  // Step 2: Report has data, so call salesByItem to get per-item details.
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(
    `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}&limit=25`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      cache: "no-store",
    },
  );

  // console.log(
  //   `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
  // );

  if (!res.ok) throw new Error(`Failed to fetch sales by item: ${res.status}`);

  const json = await res.json();

  // console.log("[getTopProducts] Raw API response:", json);

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    count: number;
  }[] = json?.data ?? [];

  // Filter out items with no actual sales (count or revenue is zero)
  const itemsWithSales = rawItems.filter(
    (item) => item.count > 0 && item.totalRevenue > 0,
  );

  if (itemsWithSales.length === 0) return [];

  const merged = itemsWithSales.reduce<
    Record<string, { totalRevenue: number; count: number }>
  >((acc, item) => {
    if (acc[item.itemName]) {
      acc[item.itemName].totalRevenue += item.totalRevenue;
      acc[item.itemName].count += item.count;
    } else {
      acc[item.itemName] = {
        totalRevenue: item.totalRevenue,
        count: item.count,
      };
    }
    return acc;
  }, {});

  const sorted = Object.entries(merged)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3);

  return sorted.map(([itemName, { totalRevenue, count }], index) => ({
    rank: (index + 1) as 1 | 2 | 3,
    productName: itemName,
    noOfSale: count,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  }));
};

// Fetch Recent Transactions
export const getRecentTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch(`${BASE}/business/ticket/bills?limit=4`, {
    headers: await authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);

  const data: RawBillListResponse = await res.json();
  return mapBillsToTransactions(data);
};

// fetch Weekly Revenue Data
export const getWeeklyRevenueData = async (): Promise<DataPoint[]> => {
  // const { startDate, endDate } = getWeekDateRange();

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${BASE}/business/report/compare-sales-by-date?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        ...(await authHeaders()),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error("Failed to fetch weekly revenue");

  const json = await res.json();

  const raw: { date: string; totalSales: number; totalRevenue: number }[] =
    json?.data ?? [];

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const last7Days: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push({
      date: formatLocalDate(d),
      label: DAY_LABELS[d.getDay()],
    });
  }

  const revenueMap: Record<string, number> = {};
  raw.forEach((item) => {
    revenueMap[item.date] = item.totalRevenue;
  });

  return last7Days.map(({ date, label }) => ({
    day: label,
    revenue: revenueMap[date] ?? 0,
  }));
};

// Fetch Sales by Category from backend API
export const getSalesByCategory = async (): Promise<CategorySalesData[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${BASE}/business/report/salesByCategory?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok)
    throw new Error(`Failed to fetch sales by category: ${res.status}`);

  const json = await res.json();

  const rawItems: {
    productCategory: string;
    totalSales: number;
    totalRevenue: number;
    netProfit: number;
  }[] = json?.data?.result ?? [];

  return rawItems.map((item) => ({
    name: item.productCategory ?? "No Category",
    totalSales: item.totalSales ?? 0,
    totalRevenue: item.totalRevenue ?? 0,
    netProfit: item.netProfit ?? 0,
  }));
};

// Fetch Hourly Sales of the Day (Today)
export const getHourlySalesData = async (): Promise<HourlyData[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `${BASE}/business/report/dailySalesReport?date=${today}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // next: { revalidate: 300 },
      cache: "no-store",
    },
  );

  if (!res.ok)
    throw new Error(`Failed to fetch daily sales report: ${res.status}`);

  const json = await res.json();

  const bills: {
    grandTotal: number;
    paidAt: string;
    isRefunded: boolean;
  }[] = json?.data?.dailySalesReport?.allBills ?? [];

  return formatHourlyData(bills);
};
