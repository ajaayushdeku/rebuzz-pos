"use client";

import { useQuery } from "@tanstack/react-query";

export interface TaxableBreakdown {
  taxableRevenue: number;
  taxableTaxAmount: number;
  nonTaxableRevenue: number;
  taxableItems: { name: string; revenue: number }[];
  nonTaxableItems: { name: string; revenue: number }[];
}

interface SalesItem {
  itemName: string;
  totalRevenue: number;
}

async function fetchTaxableBreakdown(
  startDate: string,
  endDate: string,
): Promise<TaxableBreakdown> {
  // Fetch sales by item for the date range
  const salesRes = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );

  if (!salesRes.ok) {
    throw new Error(`Failed to fetch sales: ${salesRes.status}`);
  }

  const salesJson = await salesRes.json();
  const salesItems: SalesItem[] = salesJson?.data ?? [];

  console.log("Sales By Item:", salesItems);

  if (salesItems.length === 0) {
    return {
      taxableRevenue: 0,
      taxableTaxAmount: 0,
      nonTaxableRevenue: 0,
      taxableItems: [],
      nonTaxableItems: [],
    };
  }

  // Fetch all products to get isTaxable status
  const productsRes = await fetch("/api/products", { cache: "no-store" });

  if (!productsRes.ok) {
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  }

  const productsJson = await productsRes.json();
  const rawProducts: { name?: string; isTaxable?: boolean }[] =
    productsJson?.data?.products ?? [];

  // Build a map of product name -> isTaxable
  const isTaxableMap = new Map<string, boolean>();
  for (const p of rawProducts) {
    if (p.name) {
      isTaxableMap.set(p.name.toLowerCase(), Boolean(p.isTaxable));
    }
  }

  console.log("Taxable Map:", isTaxableMap);

  // Compute taxable and non-taxable revenue by matching item name to product
  let taxableRevenue = 0;
  let nonTaxableRevenue = 0;

  // Merge duplicate item names first
  const mergedRevenue = new Map<string, number>();
  for (const item of salesItems) {
    const key = item.itemName;
    mergedRevenue.set(key, (mergedRevenue.get(key) ?? 0) + item.totalRevenue);
  }

  const taxableItems: { name: string; revenue: number }[] = [];
  const nonTaxableItems: { name: string; revenue: number }[] = [];

  for (const [itemName, revenue] of mergedRevenue) {
    const isTaxable = isTaxableMap.get(itemName.toLowerCase());

    if (isTaxable === true) {
      taxableRevenue += revenue;
      taxableItems.push({ name: itemName, revenue });
    } else {
      nonTaxableRevenue += revenue;
      nonTaxableItems.push({ name: itemName, revenue });
    }
  }

  console.log("[Taxable vs Non-Taxable Breakdown]", {
    taxableItems,
    nonTaxableItems,
    taxableRevenue,
    nonTaxableRevenue,
  });

  // Sort items by revenue descending
  taxableItems.sort((a, b) => b.revenue - a.revenue);
  nonTaxableItems.sort((a, b) => b.revenue - a.revenue);

  // Fetch bills to calculate total tax collected (excluding refunded bills)
  let taxableTaxAmount = 0;
  try {
    const billsRes = await fetch(
      `/api/tickets/bills?startDate=${startDate}&endDate=${endDate}&limit=500`,
      { cache: "no-store" },
    );

    if (billsRes.ok) {
      const billsJson = await billsRes.json();
      const bills: { taxamt?: number; isRefunded?: boolean }[] =
        billsJson?.data?.bill ?? [];

      console.log("BILLS:", billsJson);
      for (const bill of bills) {
        if (!bill.isRefunded) {
          taxableTaxAmount += bill.taxamt ?? 0;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch bills for tax amount:", err);
  }

  return {
    taxableRevenue: Math.round(taxableRevenue * 100) / 100,
    taxableTaxAmount: Math.round(taxableTaxAmount * 100) / 100,
    nonTaxableRevenue: Math.round(nonTaxableRevenue * 100) / 100,
    taxableItems,
    nonTaxableItems,
  };
}

export function useTaxableBreakdown(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["taxable-breakdown", startDate, endDate],
    queryFn: () => fetchTaxableBreakdown(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
