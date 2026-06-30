// import { SalesTrendsData } from "@/components/dashboardComponents/salesRevenue/SalesTrendChart";
import { PeakHourlyData } from "@/components/dashboardComponents/salesRevenue/PeakHoursAnalysis";
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
