"use client";

import { useQuery } from "@tanstack/react-query";

export interface HighestTaxItem {
  name: string;
  totalTaxAmount: number;
  transactionCount: number;
}

interface SalesByItem {
  itemName: string;
  totalRevenue: number;
  price: number;
  count: number;
}

/**
 * Tax generated per item from the salesByItem report.
 *
 * The API doesn't return tax directly, so it's derived per item as:
 *   taxGenerated = totalRevenue - (price × count)
 * i.e. revenue above the net (pre-tax) sales value. Duplicate item names are
 * merged, summing both tax and quantity sold.
 */
async function fetchHighestTaxItems(
  startDate: string,
  endDate: string,
): Promise<HighestTaxItem[]> {
  const res = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch sales by item: ${res.status}`);
  }

  const json = await res.json();
  const items: SalesByItem[] = json?.data ?? [];

  console.log("ITEMS:", items);

  const merged = new Map<string, { tax: number; count: number }>();
  for (const item of items) {
    const revenue = item.totalRevenue ?? 0;
    const count = item.count ?? 0;
    const netSales = (item.price ?? 0) * count;
    const tax = revenue - netSales;

    const prev = merged.get(item.itemName) ?? { tax: 0, count: 0 };
    merged.set(item.itemName, {
      tax: prev.tax + tax,
      count: prev.count + count,
    });
  }

  return Array.from(merged.entries())
    .map(([name, { tax, count }]) => ({
      name,
      totalTaxAmount: Math.round(tax * 100) / 100,
      transactionCount: count,
    }))
    // Only keep items that actually generated tax.
    .filter((item) => item.totalTaxAmount > 0);
}

export function useHighestTaxItems(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["highest-tax-items", startDate, endDate],
    queryFn: () => fetchHighestTaxItems(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(startDate && endDate),
  });
}
