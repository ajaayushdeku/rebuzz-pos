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

interface RawProduct {
  _id?: string;
  name?: string;
  isTaxable?: boolean;
}

interface RawListBill {
  invoiceNo?: number;
  taxamt?: number;
  isRefunded?: boolean;
}

// Bill-detail shapes (only what we read).
interface RawBillLine {
  product?: string;
  productName?: string;
  taxAmount?: number;
  taxApplied?: boolean;
}
interface RawBillItemGroup {
  item?: RawBillLine[];
}
interface RawDetailBill {
  isRefunded?: boolean;
  items?: RawBillItemGroup[];
}

const EMPTY: TaxableBreakdown = {
  taxableRevenue: 0,
  taxableTaxAmount: 0,
  nonTaxableRevenue: 0,
  taxableItems: [],
  nonTaxableItems: [],
};

// Cap detail requests used to classify custom products.
const MAX_DETAILS = 400;

async function fetchTaxableBreakdown(
  startDate: string,
  endDate: string,
): Promise<TaxableBreakdown> {
  // ── Sales by item (revenue per item name) ──
  const salesRes = await fetch(
    `/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );
  if (!salesRes.ok) {
    throw new Error(`Failed to fetch sales: ${salesRes.status}`);
  }
  const salesJson = await salesRes.json();
  const salesItems: SalesItem[] = salesJson?.data ?? [];
  if (salesItems.length === 0) return EMPTY;

  // Merge duplicate item names.
  const mergedRevenue = new Map<string, number>();
  for (const item of salesItems) {
    mergedRevenue.set(
      item.itemName,
      (mergedRevenue.get(item.itemName) ?? 0) + item.totalRevenue,
    );
  }

  // ── Products (regular-product tax status — unchanged) ──
  const productsRes = await fetch("/api/products", { cache: "no-store" });
  if (!productsRes.ok) {
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  }
  const productsJson = await productsRes.json();
  const rawProducts: RawProduct[] = productsJson?.data?.products ?? [];

  const isTaxableMap = new Map<string, boolean>(); // lowerName → isTaxable
  const knownNames = new Set<string>(); // lowercased product names
  for (const p of rawProducts) {
    if (p.name) {
      const key = p.name.toLowerCase();
      isTaxableMap.set(key, Boolean(p.isTaxable));
      knownNames.add(key);
    }
  }

  // ── Bills: total tax collected + per-item tax for custom products ──
  let taxableTaxAmount = 0;
  // Product names (lowercased) whose bill line had tax applied. Custom-product
  // classification reads this since their taxability is set at invoice time.
  const taxedNames = new Set<string>();

  try {
    const billsRes = await fetch(
      `/api/tickets/bills?startDate=${startDate}&endDate=${endDate}&limit=5000`,
      { cache: "no-store" },
    );
    if (billsRes.ok) {
      const billsJson = await billsRes.json();
      const bills: RawListBill[] = billsJson?.data?.bill ?? [];

      const invoiceNos: number[] = [];
      for (const bill of bills) {
        if (bill.isRefunded) continue;
        taxableTaxAmount += bill.taxamt ?? 0;
        if (bill.invoiceNo != null) invoiceNos.push(bill.invoiceNo);
      }

      // Bill details give per-item tax — the source of truth for custom items.
      const details = await Promise.all(
        invoiceNos.slice(0, MAX_DETAILS).map(async (invoiceNo) => {
          try {
            const res = await fetch(`/api/transactions/${invoiceNo}`, {
              cache: "no-store",
            });
            if (!res.ok) return null;
            const json = await res.json();
            return (json?.data?.bill ?? null) as RawDetailBill | null;
          } catch {
            return null;
          }
        }),
      );

      for (const detail of details) {
        if (!detail || detail.isRefunded) continue;
        for (const group of detail.items ?? []) {
          for (const line of group.item ?? []) {
            const name = line.productName ?? "";
            if (!name) continue;

            // Record by name whether tax was applied on this line — trust the
            // bill line's `taxApplied` flag (fall back to a positive amount).
            const taxed =
              line.taxApplied === true || (Number(line.taxAmount) || 0) > 0;
            if (taxed) taxedNames.add(name.toLowerCase());
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch bills for tax breakdown:", err);
  }

  // ── Classify each item into taxable / non-taxable ──
  const taxableItems: { name: string; revenue: number }[] = [];
  const nonTaxableItems: { name: string; revenue: number }[] = [];
  let taxableRevenue = 0;
  let nonTaxableRevenue = 0;

  for (const [itemName, revenue] of mergedRevenue) {
    const lower = itemName.toLowerCase();

    let taxable: boolean;
    if (knownNames.has(lower)) {
      // Regular product — use the Products API `isTaxable` (existing logic).
      taxable = isTaxableMap.get(lower) === true;
    } else {
      // Custom product — the bills are the source of truth: taxed if any of
      // its bill lines had `taxApplied` set.
      taxable = taxedNames.has(lower);
    }

    if (taxable) {
      taxableRevenue += revenue;
      taxableItems.push({ name: itemName, revenue });
    } else {
      nonTaxableRevenue += revenue;
      nonTaxableItems.push({ name: itemName, revenue });
    }
  }

  taxableItems.sort((a, b) => b.revenue - a.revenue);
  nonTaxableItems.sort((a, b) => b.revenue - a.revenue);

  // Custom products are folded into taxable / non-taxable above.
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
