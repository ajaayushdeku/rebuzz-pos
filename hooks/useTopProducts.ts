"use client";

import { useQuery } from "@tanstack/react-query";
import { TopProduct } from "@/components/dashboardComponents/salesRevenue/top-product-columns";

async function fetchTopProducts(
  startDate: string,
  endDate: string,
): Promise<TopProduct[]> {
  const res = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { headers: { "Content-Type": "application/json" }, cache: "no-store" },
  );

  if (!res.ok) throw new Error(`Failed to fetch sales by item: ${res.status}`);

  const json = await res.json();

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    category: string;
    count: number;
    netProfit?: number;
  }[] = json?.data ?? [];

  if (rawItems.length === 0) return [];

  // Merge duplicate item names
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

  // Sort by count descending
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
}

export function useTopProducts(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["top-products", startDate, endDate],
    queryFn: () => fetchTopProducts(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
