// import { SalesTrendsData } from "@/components/dashboardComponents/salesRevenue/SalesTrendChart";
import { PeakHourlyData } from "@/components/dashboardComponents/salesRevenue/PeakHoursAnalysis";
import { PeakDayData } from "@/components/dashboardComponents/salesRevenue/PeakDaysAnalysis";
import { SlowProduct } from "@/components/dashboardComponents/salesRevenue/slow-product-columns";
import { TopProduct } from "@/components/dashboardComponents/salesRevenue/top-product-columns";
import { formatPeakHourAverages } from "@/utils/formatHourReportToday";

// import {
//   // mockRevenueVsProfit,
//   mockSalesTrendData,
//   // mockSlowProducts,
//   // mockTopProducts,
// } from "@/lib/mockData/mock-salesrevenue";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Top/Popular Products
export const getTopProducts = async (): Promise<TopProduct[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Dynamic date range — last 7 days
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // console.log(
  //   `[getTopProducts] Fetching top products for date: ${startDate} to ${endDate}`,
  // );

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

  // console.log("[getTopProducts] Raw API response:", json);

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    category: string;
    count: number;
    netProfit?: number;
  }[] = json?.data ?? [];

  if (rawItems.length === 0) return [];

  // Merge duplicate item names — sum their count, totalRevenue, and netProfit
  const merged = rawItems.reduce<
    Record<string, { totalRevenue: number; count: number; netProfit: number }>
  >((acc, item) => {
    if (acc[item.itemName]) {
      acc[item.itemName].totalRevenue += item.totalRevenue;
      acc[item.itemName].count += item.count;
      acc[item.itemName].netProfit += item.netProfit ?? 0;
    } else {
      acc[item.itemName] = {
        totalRevenue: item.totalRevenue,
        count: item.count,
        netProfit: item.netProfit ?? 0,
      };
    }
    return acc;
  }, {});

  // Sort by count descending, take top 3
  const sorted = Object.entries(merged).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  const totalCount = sorted.reduce((sum, [, { count }]) => sum + count, 0);

  return sorted.map(
    ([itemName, { totalRevenue, count, netProfit }], index) => ({
      name: itemName,
      category:
        rawItems.find((item) => item.itemName === itemName)?.category ??
        "Uncategorized",
      revenue: Math.round(totalRevenue * 100) / 100,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      count,
      netProfit: Math.round(netProfit * 100) / 100,
    }),
  );
};

export async function getSlowProducts(): Promise<SlowProduct[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const today = new Date().toISOString().split("T")[0];
  const threeDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch all products and sales data in parallel
  const [productsRes, salesRes] = await Promise.all([
    fetch(`${BASE}/business/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 },
    }),
    fetch(
      `${BASE}/business/report/salesByItem?startDate=${threeDaysAgo}&endDate=${today}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      },
    ),
  ]);

  // console.log(" Products:", productsRes);

  if (!productsRes.ok)
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  if (!salesRes.ok)
    throw new Error(`Failed to fetch sales: ${salesRes.status}`);

  const productsJson = await productsRes.json();
  const salesJson = await salesRes.json();

  const allProducts: { _id: string; name: string; inStock: number }[] =
    productsJson?.data?.products ?? [];
  const salesItems: { itemName: string }[] = salesJson?.data ?? [];

  // Build a set of product names that had sales in the last 3 days
  const soldNames = new Set<string>();
  salesItems.forEach((item) => soldNames.add(item.itemName));

  // Return products that had NO sales (exceptions) — these are slow-moving
  return allProducts
    .filter(
      (product) =>
        !soldNames.has(product.name) &&
        product.name.toLowerCase() !== "customer" &&
        product.name.toLowerCase() !== "custom",
    )
    .map((product) => ({
      name: product.name,
      days: 3,
      stockAmount: product.inStock ?? 0,
    }));
}

// Peak Hours — average sales per hour-of-day across a date range.
// Buckets every bill by its hour-of-day, then divides each hour's total by the
// number of days in the range to get the average sales for that hour.
export const getPeakHoursData = async (
  startDate: string,
  endDate: string,
): Promise<PeakHourlyData[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(
    `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error(`Failed to fetch sales report: ${res.status}`);

  const json = await res.json();

  // The report endpoint nests bills under `report` for ranges and
  // `dailySalesReport` for single days — support both.
  const bills: {
    grandTotal: number;
    paidAt: string;
    isRefunded: boolean;
  }[] =
    json?.data?.report?.allBills ??
    json?.data?.dailySalesReport?.allBills ??
    [];

  // For each hour, average the per-day hourly totals across only the days that
  // have data for that hour (grouped by date + hour).
  return formatPeakHourAverages(bills);
};

// ── Peak Days Analysis ──────────────────────────────────────────────────────
// Average orders (invoices created) and sales (bills created) per weekday,
// averaged across the occurrences of each weekday within the date range.

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // getUTCDay()
const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Date portion (YYYY-MM-DD) of an ISO/space-separated datetime string. */
const datePart = (value: string | undefined | null): string | null => {
  if (!value) return null;
  const part = value.includes("T") ? value.split("T")[0] : value.split(" ")[0];
  return part || null;
};

/** Weekday index (0=Sun … 6=Sat) for a YYYY-MM-DD string, or null. */
const weekdayOf = (dateStr: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return isNaN(dt.getTime()) ? null : dt.getUTCDay();
};

/**
 * Average the per-date record counts by weekday: first count records per
 * calendar date, then for each weekday average those daily counts across only
 * the dates (of that weekday) that have data.
 */
const averageCountsByWeekday = (
  dates: (string | undefined | null)[],
): Record<string, number> => {
  const perDay: Record<string, number> = {};
  for (const raw of dates) {
    const d = datePart(raw);
    if (!d) continue;
    perDay[d] = (perDay[d] ?? 0) + 1;
  }

  const buckets: Record<string, { sum: number; days: number }> = {};
  for (const [d, count] of Object.entries(perDay)) {
    const wd = weekdayOf(d);
    if (wd === null) continue;
    const label = WEEKDAY_LABELS[wd];
    if (!buckets[label]) buckets[label] = { sum: 0, days: 0 };
    buckets[label].sum += count;
    buckets[label].days += 1;
  }

  const result: Record<string, number> = {};
  for (const label of WEEKDAY_ORDER) {
    const b = buckets[label];
    result[label] =
      b && b.days > 0 ? Math.round((b.sum / b.days) * 100) / 100 : 0;
  }
  return result;
};

export const getPeakDaysData = async (
  startDate: string,
  endDate: string,
): Promise<PeakDayData[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [reportRes, ticketRes] = await Promise.all([
    // Sales (bills) — the report endpoint already filters by date range.
    fetch(`${BASE}/business/report?startDate=${startDate}&endDate=${endDate}`, {
      headers,
      cache: "no-store",
    }),
    // Orders (invoices) — endpoint has no date filtering, so fetch all.
    fetch(`${BASE}/business/ticket/unarchived`, {
      headers,
      cache: "no-store",
    }),
  ]);

  // ── Sales (bills) ──
  let bills: { createdAt?: string; paidAt?: string }[] = [];
  if (reportRes.ok) {
    const json = await reportRes.json();
    bills =
      json?.data?.report?.allBills ??
      json?.data?.dailySalesReport?.allBills ??
      [];
  }
  const salesAvg = averageCountsByWeekday(
    bills.map((b) => b.createdAt ?? b.paidAt),
  );

  // ── Orders (invoices) — filter to the selected range on the frontend ──
  let tickets: { createdAt?: string }[] = [];
  if (ticketRes.ok) {
    const json = await ticketRes.json();
    tickets = json?.data?.tickets ?? json?.data?.allTickets ?? [];
  }
  const rangeStart = datePart(startDate) ?? startDate;
  const rangeEnd = datePart(endDate) ?? endDate;
  const ordersInRange = tickets.filter((t) => {
    const d = datePart(t.createdAt);
    // YYYY-MM-DD strings compare correctly lexicographically.
    return d !== null && d >= rangeStart && d <= rangeEnd;
  });
  const ordersAvg = averageCountsByWeekday(
    ordersInRange.map((t) => t.createdAt),
  );

  return WEEKDAY_ORDER.map((day) => ({
    day,
    averageOrders: ordersAvg[day] ?? 0,
    averageSales: salesAvg[day] ?? 0,
  }));
};

// export async function getSalesTrends(): Promise<SalesTrendsData> {
//   // try {
//   //   const res = await fetch(
//   //     `${process.env.NEXT_PUBLIC_API_URL}/api/sales/trends`,
//   //     { next: { revalidate: 300 } },
//   //   );
//   //   if (!res.ok) throw new Error();
//   //   return res.json();
//   // } catch {
//   return mockSalesTrendData;
// }
