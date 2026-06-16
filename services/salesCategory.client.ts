import { CategorySalesData } from "@/components/dashboardComponents/overviewDash/SalesCategoryChart";

/**
 * Client-side fetcher for sales-by-category report data.
 * Uses the Next.js API route proxy so auth cookies are forwarded.
 */
export async function fetchSalesByCategoryClient(
  startDate?: string,
  endDate?: string,
): Promise<CategorySalesData[]> {
  const end = endDate ?? new Date().toISOString().split("T")[0];
  const start =
    startDate ??
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  const res = await fetch(
    `/api/report/salesByCategory?startDate=${start}&endDate=${end}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch sales by category: ${res.status}`);
  }

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
}
