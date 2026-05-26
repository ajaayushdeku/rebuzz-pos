import { StatsApiResponse, WinningApiResponse } from "@/lib/dashboardstats";
import { authHeaders } from "../authServices/session";
import axios from "axios";
import { RawReportResponse } from "@/lib/types/report";
import mapReportToStats from "@/lib/mappers/report";
import {
  mockSalesLocation,
  // mockHourlySales,
  // mockTopProducts,
  // mockWeeklyRevenue,
  // mockWinningStats,
} from "@/lib/mockData/mock-overviewdata";
import { TopProduct } from "@/components/dashboardComponents/overviewDash/TopItems";
import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import { RawBill, RawBillListResponse } from "@/lib/types/bill";
import { DataPoint } from "@/lib/types/chart";
import { LocationData } from "@/components/dashboardComponents/overviewDash/SalesLocationChart";
import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";
import { mapBillsToTransactions } from "@/lib/mappers/transaction";
import { formatWeeklyData } from "@/utils/formatWeeklyReportData";
import { cookies } from "next/headers";
import { getWeekDateRange } from "@/lib/config/weeklyDateRange";
import { formatHourlyData } from "@/utils/formatHourReportToday";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Fetch Stat data of the business sales
export const getStatsData = async (
  startDateStr?: string,
  endDateStr?: string,
): Promise<StatsApiResponse> => {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 30); // 30 days from today by default

  const start = startDateStr ?? defaultStart.toISOString().split("T")[0];
  const end = endDateStr ?? today.toISOString().split("T")[0];

  // Params for the api fetch for stats data
  const params = new URLSearchParams({
    startDate: start,
    endDate: end,
    limit: "25",
  });

  const [reportRes, salesByItemRes] = await Promise.all([
    axios.get(`${BASE}/business/report?${params}`, {
      headers: await authHeaders(),
    }),
    axios.get(
      `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
      { headers: await authHeaders() },
    ),
  ]);

  const data: RawReportResponse = reportRes.data;

  // Compute total products sold from salesByItem data
  const salesItems: { count: number }[] = salesByItemRes.data?.data ?? [];
  const totalProductsSold = salesItems.reduce(
    (sum, item) => sum + (item.count ?? 0),
    0,
  );

  return mapReportToStats(data, totalProductsSold);
};

// Fetch the WinningStats by using other api to get specific data
export const getWinningStats = async (): Promise<WinningApiResponse> => {
  // Fetch all three in parallel
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

  // Format as range e.g. "2PM" → "2PM - 3PM"
  const formatPeakHourRange = (hour: string): string => {
    if (hour === "N/A") return "No data";
    const match = hour.match(/^(\d+)(AM|PM)$/);
    if (!match) return hour;
    const num = parseInt(match[1]);
    const period = match[2];
    // Compute next hour
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

  // console.log("Start Date:", startDate);
  // console.log("End Date:", endDate);
  // Dynamic date range — last 7 days
  // const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  //   .toISOString()
  //   .split("T")[0];

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

  // console.log("Top Products:", json);

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    count: number;
  }[] = json?.data ?? [];

  if (rawItems.length === 0) return [];

  // Merge duplicate item names — sum their count and totalRevenue
  const merged = rawItems.reduce<
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

  // console.log("Top 3 Products:", merged);

  // Sort by count descending, take top 3
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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const { startDate, endDate } = getWeekDateRange();

  const url = new URL(`${BASE}/business/report`);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("limit", "25");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error("Failed to fetch weekly revenue");

  const json = await res.json();

  const bills: RawBill[] = json?.data?.report?.allBills ?? [];
  // console.log("BIlls:", bills);
  return formatWeeklyData(bills);
};

// Mock Data used for Location Sales
export const getSalesLocations = async (): Promise<LocationData[]> => {
  //   const res = await fetch(
  //     "https://api.com/sales-locations",
  //     {
  //       next: { revalidate: 3600 },
  //     },
  //   );
  //   return res.json();
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
      next: { revalidate: 300 }, // revalidate every 5 mins
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

  console.log("Hour Sales Details:", bills);

  return formatHourlyData(bills);
};
