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

  return rawItems.map((item) => {
    const revenue = item.totalRevenue ?? 0;
    const cost = (item.costPrice ?? 0) * (item.count ?? 0);
    const profit = item.profit ?? revenue - cost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      name: item.itemName,
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
