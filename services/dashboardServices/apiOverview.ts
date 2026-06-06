import { StatsApiResponse, WinningApiResponse } from "@/lib/dashboardstats";
import { authHeaders } from "../authServices/session";
import {
  mockSalesLocation,
  // mockHourlySales,
  // mockTopProducts,
  // mockWeeklyRevenue,
  // mockWinningStats,
} from "@/lib/mockData/mock-overviewdata";
import { TopProduct } from "@/components/dashboardComponents/overviewDash/TopItems";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import { RawBillListResponse } from "@/lib/types/bill";
import { DataPoint } from "@/lib/types/chart";
import { LocationData } from "@/components/dashboardComponents/overviewDash/SalesLocationChart";
import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { cookies } from "next/headers";
import { getWeekDateRange } from "@/lib/config/weeklyDateRange";
import { formatHourlyData } from "@/utils/formatHourReportToday";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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

  // console.log(
  //   `[getStatsData] Fetching stats from ${start} to ${end} using compare type: ${compareType}`,
  // );

  const headers = await authHeaders();

  // Unique per-invocation timestamp to prevent server-side dedup of
  // concurrent current/previous period requests
  const _ts = Date.now();

  const [compareRes, salesByItemRes] = await Promise.all([
    fetch(
      `${BASE}/business/report/${compareEndpoint(compareType)}?startDate=${start}&endDate=${end}&_t=${_ts}`,
      { headers, cache: "no-store" },
    ),
    fetch(
      `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}&_t=${_ts + 1}`,
      { headers, cache: "no-store" },
    ),
  ]);

  // Aggregate daily/weekly/monthly/yearly compare-sales data
  const compareJson = await compareRes.json();
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

  // Compute total products sold and net profit from salesByItem data
  const salesByItemJson = await salesByItemRes.json();
  const salesItems: { count: number; netProfit: number }[] =
    salesByItemJson?.data ?? [];
  const totalProductsSold = salesItems.reduce(
    (sum, item) => sum + (item.count ?? 0),
    0,
  );

  const netProfit =
    salesItems.reduce((sum, item) => sum + (item.netProfit ?? 0), 0) -
    (salesByItemJson.totalDiscount ?? 0) -
    (salesByItemJson.totalRedeemPoint ?? 0);

  // console.log(
  //   "[getStatsData] Type:",
  //   compareType,
  //   "Revenue:",
  //   totalRevenue,
  //   "Orders:",
  //   totalOrders,
  // );

  // console.log("RESULT", {
  //   start,
  //   end,
  //   totalRevenue,
  //   totalOrders,
  // });

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

  return {
    topSellingProduct: { value: topSellingProduct },
    peakHour: { value: peakHour },
    bestDay: { value: bestDay },
  };
};

// Fetch Top/Popular Products of the Day (Today)
export const getTopProducts = async (): Promise<TopProduct[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) throw new Error(`Failed to fetch sales by item: ${res.status}`);

  const json = await res.json();

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

// Mock Data used for Location Sales
export const getSalesLocations = async (): Promise<LocationData[]> => {
  return mockSalesLocation;
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
      next: { revalidate: 300 },
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
