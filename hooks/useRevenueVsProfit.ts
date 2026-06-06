"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductData } from "@/components/dashboardComponents/salesRevenue/RevenueVsProfitChart";

const RANGE_DAYS: Record<string, number> = {
  today: 0,
  "7d": 6,
  "30d": 29,
  "90d": 89,
  "180d": 179,
};

type RangeKey = keyof typeof RANGE_DAYS;

async function fetchRevenueVsProfit(
  startDate: string,
  endDate: string,
): Promise<ProductData[]> {
  console.log(`Fetching revenue vs profit from ${startDate} to ${endDate}`);

  const res = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { headers: { "Content-Type": "application/json" }, cache: "no-store" },
  );

  if (!res.ok)
    throw new Error(`Failed to fetch revenue vs profit: ${res.status}`);

  const json = await res.json();

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    netProfit: number;
  }[] = json?.data ?? [];

  if (rawItems.length === 0) return [];

  // Merge duplicates
  const merged = rawItems.reduce<
    Record<string, { revenue: number; profit: number }>
  >((acc, item) => {
    if (acc[item.itemName]) {
      acc[item.itemName].revenue += item.totalRevenue;
      acc[item.itemName].profit += item.netProfit;
    } else {
      acc[item.itemName] = {
        revenue: item.totalRevenue,
        profit: item.netProfit,
      };
    }
    return acc;
  }, {});

  return Object.entries(merged)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 6)
    .map(([product, { revenue, profit }]) => ({
      product,
      revenue: Math.round(revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    }));
}

export function useRevenueVsProfit(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["revenue-vs-profit", startDate, endDate],
    queryFn: () => fetchRevenueVsProfit(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
