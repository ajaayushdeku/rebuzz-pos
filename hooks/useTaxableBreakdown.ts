"use client";

import { useQuery } from "@tanstack/react-query";

/** One row in a breakdown list. */
export interface TaxBreakdownItem {
  name: string;
  revenue: number;
  tax: number;
  count: number;
  isCustom: boolean;
  taxable: boolean;
}

export interface TaxableBreakdown {
  /**
   * Catalogue products **only**. Custom items are reported separately below,
   * because their taxability is inferred from whether tax happened to be
   * charged rather than configured on a product — mixing the two would hide
   * how much of the split rests on that weaker signal.
   */
  taxableRevenue: number;
  taxableTaxAmount: number;
  nonTaxableRevenue: number;
  nonTaxableTaxAmount: number;

  /** Catalogue products only — custom ones live in `customItems`. */
  taxableItems: TaxBreakdownItem[];
  nonTaxableItems: TaxBreakdownItem[];

  /** Items with no catalogue match, each tagged taxable / non-taxable. */
  customItems: TaxBreakdownItem[];
  customTaxableRevenue: number;
  customTaxableTaxAmount: number;
  customNonTaxableRevenue: number;
  customNonTaxableTaxAmount: number;
  customTaxableCount: number;
  customNonTaxableCount: number;
}

/** A row of `/api/report/salesByItem`. */
interface SalesItem {
  itemName: string;
  totalRevenue?: number;
  totalTax?: number;
  count?: number;
}

interface RawProduct {
  _id?: string;
  name?: string;
  isTaxable?: boolean;
}

export const EMPTY_TAX_BREAKDOWN: TaxableBreakdown = {
  taxableRevenue: 0,
  taxableTaxAmount: 0,
  nonTaxableRevenue: 0,
  nonTaxableTaxAmount: 0,
  taxableItems: [],
  nonTaxableItems: [],
  customItems: [],
  customTaxableRevenue: 0,
  customTaxableTaxAmount: 0,
  customNonTaxableRevenue: 0,
  customNonTaxableTaxAmount: 0,
  customTaxableCount: 0,
  customNonTaxableCount: 0,
};

/* Catalogue keys to try for one sales row, most specific first. */
function catalogueKeys(itemName: string): string[] {
  const keys: string[] = [];
  const push = (value: string) => {
    const key = value.trim().toLowerCase();
    if (key && !keys.includes(key)) keys.push(key);
  };

  push(itemName);

  // Drop a trailing "[…]" variant label.
  const withoutBrackets = itemName.replace(/\s*\[[^\]]*\]\s*$/, "");
  push(withoutBrackets);

  // Then a trailing "(…)" option list.
  push(withoutBrackets.replace(/\s*\([^)]*\)\s*$/, ""));

  return keys;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

async function fetchTaxableBreakdown(
  startDate: string,
  endDate: string,
): Promise<TaxableBreakdown> {
  // ── Sales and catalogue, fetched together ────────────────────────────────
  // Neither depends on the other, so they run in parallel; the products call
  // used to wait on the sales call for no reason.
  const [salesRes, productsRes] = await Promise.all([
    fetch(`/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`, {
      cache: "no-store",
    }),
    fetch("/api/products", { cache: "no-store" }),
  ]);

  if (!salesRes.ok) {
    throw new Error(`Failed to fetch sales: ${salesRes.status}`);
  }
  if (!productsRes.ok) {
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  }

  const [salesJson, productsJson] = await Promise.all([
    salesRes.json(),
    productsRes.json(),
  ]);

  const salesItems: SalesItem[] = salesJson?.data ?? [];
  if (salesItems.length === 0) return EMPTY_TAX_BREAKDOWN;

  // One row per (item, payment method), so the same item appears more than
  // once — merge on name before classifying.
  type Merged = { name: string; revenue: number; tax: number; count: number };
  const merged = new Map<string, Merged>();

  for (const item of salesItems) {
    if (!item.itemName) continue;
    const key = item.itemName.toLowerCase();
    const existing = merged.get(key);

    if (existing) {
      existing.revenue += item.totalRevenue ?? 0;
      existing.tax += item.totalTax ?? 0;
      existing.count += item.count ?? 0;
    } else {
      merged.set(key, {
        name: item.itemName,
        revenue: item.totalRevenue ?? 0,
        tax: item.totalTax ?? 0,
        count: item.count ?? 0,
      });
    }
  }

  // ── Catalogue: taxability of regular products ────────────────────────────
  const rawProducts: RawProduct[] = productsJson?.data?.products ?? [];

  const isTaxableByName = new Map<string, boolean>();
  for (const product of rawProducts) {
    if (product.name) {
      isTaxableByName.set(
        product.name.toLowerCase(),
        Boolean(product.isTaxable),
      );
    }
  }

  // ── Classify ─────────────────────────────────────────────────────────────
  const taxableItems: TaxBreakdownItem[] = [];
  const nonTaxableItems: TaxBreakdownItem[] = [];
  const customItems: TaxBreakdownItem[] = [];

  let taxableRevenue = 0;
  let taxableTaxAmount = 0;
  let nonTaxableRevenue = 0;
  let nonTaxableTaxAmount = 0;
  let customTaxableRevenue = 0;
  let customTaxableTaxAmount = 0;
  let customNonTaxableRevenue = 0;
  let customNonTaxableTaxAmount = 0;
  let customTaxableCount = 0;
  let customNonTaxableCount = 0;

  for (const entry of merged.values()) {
    const matchedKey = catalogueKeys(entry.name).find((key) =>
      isTaxableByName.has(key),
    );
    const isCustom = matchedKey === undefined;

    // Catalogue products follow their `isTaxable` flag. Custom items have no
    // flag to follow — whether tax was charged on the invoice is the only
    // record of their taxability, so a non-zero `totalTax` is the test.
    const taxable = isCustom
      ? entry.tax > 0
      : isTaxableByName.get(matchedKey) === true;

    const row: TaxBreakdownItem = {
      name: entry.name,
      revenue: round2(entry.revenue),
      tax: round2(entry.tax),
      count: entry.count,
      isCustom,
      taxable,
    };

    // Catalogue and custom totals are kept entirely apart — the headline
    // taxable / non-taxable figures count catalogue products only.
    if (isCustom) {
      customItems.push(row);
      if (taxable) {
        customTaxableRevenue += entry.revenue;
        customTaxableTaxAmount += entry.tax;
        customTaxableCount += 1;
      } else {
        customNonTaxableRevenue += entry.revenue;
        customNonTaxableTaxAmount += entry.tax;
        customNonTaxableCount += 1;
      }
    } else if (taxable) {
      taxableItems.push(row);
      taxableRevenue += entry.revenue;
      taxableTaxAmount += entry.tax;
    } else {
      nonTaxableItems.push(row);
      nonTaxableRevenue += entry.revenue;
      nonTaxableTaxAmount += entry.tax;
    }
  }

  const byRevenue = (a: TaxBreakdownItem, b: TaxBreakdownItem) =>
    b.revenue - a.revenue;
  taxableItems.sort(byRevenue);
  nonTaxableItems.sort(byRevenue);
  // Taxable custom items first, then by revenue.
  customItems.sort(
    (a, b) => Number(b.taxable) - Number(a.taxable) || b.revenue - a.revenue,
  );

  return {
    taxableRevenue: round2(taxableRevenue),
    taxableTaxAmount: round2(taxableTaxAmount),
    nonTaxableRevenue: round2(nonTaxableRevenue),
    nonTaxableTaxAmount: round2(nonTaxableTaxAmount),
    taxableItems,
    nonTaxableItems,
    customItems,
    customTaxableRevenue: round2(customTaxableRevenue),
    customTaxableTaxAmount: round2(customTaxableTaxAmount),
    customTaxableCount,
    customNonTaxableCount,
    customNonTaxableRevenue: round2(customNonTaxableRevenue),
    customNonTaxableTaxAmount: round2(customNonTaxableTaxAmount),
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
