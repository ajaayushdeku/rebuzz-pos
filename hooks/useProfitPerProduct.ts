"use client";

import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";

async function fetchProfitPerProduct(
  startDate: string,
  endDate: string,
): Promise<Product[]> {
  const res = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );

  if (!res.ok)
    throw new Error(`Failed to fetch profit per product: ${res.status}`);

  const json = await res.json();

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    count: number;
    profit?: number;
    costPrice?: number;
  }[] = json?.data ?? [];

  // Merge items with the same name (same as getTopProducts in apiOverview)
  const merged = rawItems.reduce<
    Record<
      string,
      {
        totalRevenue: number;
        count: number;
        profit: number;
        costPrice: number;
      }
    >
  >((acc, item) => {
    const revenue = item.totalRevenue ?? 0;
    const costPrice = item.costPrice ?? 0;
    const count = item.count ?? 0;
    const profit = item.profit ?? revenue - costPrice * count;

    if (acc[item.itemName]) {
      acc[item.itemName].totalRevenue += revenue;
      acc[item.itemName].count += count;
      acc[item.itemName].profit += profit;
      // Keep the higher costPrice as the unit cost
      acc[item.itemName].costPrice = Math.max(
        acc[item.itemName].costPrice,
        costPrice,
      );
    } else {
      acc[item.itemName] = {
        totalRevenue: revenue,
        count,
        profit,
        costPrice,
      };
    }
    return acc;
  }, {});

  return Object.values(merged).map((item) => {
    const revenue = item.totalRevenue;
    const cost = item.costPrice * item.count;
    const profit = item.profit;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      name: Object.keys(merged).find((key) => merged[key] === item)!,
      revenue,
      cogs: cost,
      profit,
      margin,
    };
  });
}

export function useProfitPerProduct(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["profit-per-product", startDate, endDate],
    queryFn: () => fetchProfitPerProduct(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
