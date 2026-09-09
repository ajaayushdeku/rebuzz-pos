"use client";

import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";
import { mergeSalesItems } from "@/lib/profitPerProduct";

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

  return mergeSalesItems(json?.data ?? []);
}

export function useProfitPerProduct(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["profit-per-product", startDate, endDate],
    queryFn: () => fetchProfitPerProduct(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
