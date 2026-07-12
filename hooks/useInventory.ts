import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";

export const INVENTORY_KEY = ["inventory"] as const;
const SALES_KEY = ["salesByItem"] as const;

// ── Inventory fetcher ─────────────────────────────────────────────────────

async function fetchInventoryClient(): Promise<InventoryItem[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Failed to fetch inventory: ${res.status}`);
  const json = await res.json();
  const raw = json?.data?.products ?? [];

  return (
    raw
      // .filter((p: any) => p && typeof p.costPrice === "number" && p.costPrice > 0)
      .map(
        (p: any): InventoryItem => ({
          id: p._id,
          name: p.name ?? "Unnamed Product",
          unit: p.soldBy ?? "each",
          inStock: typeof p.inStock === "number" ? p.inStock : 0,
          lowStock: typeof p.lowStock === "number" ? p.lowStock : 0,
          usesStocks: Boolean(p.usesStocks),
          isTaxable: Boolean(p.isTaxable),
          isAvailable:
            p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
          orderedCount: typeof p.orderedCount === "number" ? p.orderedCount : 0,
          costPrice: p.costPrice,
          price: typeof p.price === "number" ? p.price : 0,
        }),
      )
  );
}

// ── Sales-by-item fetcher ─────────────────────────────────────────────────

async function fetchSalesByItemClient(
  startDate?: string,
  endDate?: string,
): Promise<MergedSalesItem[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();

  const res = await fetch(`/api/report/salesByItem${qs ? `?${qs}` : ""}`);

  if (!res.ok) throw new Error(`Failed to fetch sales: ${res.status}`);
  const json = await res.json();
  const rawItems: any[] = json?.data ?? [];

  console.log("Sales by items:", rawItems);

  if (rawItems.length === 0) return [];

  // Merge duplicates — same product sold at different prices
  const merged: Record<
    string,
    { count: number; totalRevenue: number; netProfit: number; category: string }
  > = {};

  for (const item of rawItems) {
    if (merged[item.itemName]) {
      merged[item.itemName].count += item.count;
      merged[item.itemName].totalRevenue += item.totalRevenue;
      merged[item.itemName].netProfit += item.netProfit;
    } else {
      merged[item.itemName] = {
        count: item.count,
        totalRevenue: item.totalRevenue,
        netProfit: item.netProfit,
        category: item.category ?? "Uncategorized",
      };
    }
  }

  return Object.entries(merged)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, { count, totalRevenue, netProfit, category }]) => ({
      name,
      count,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      category,
    }));
}

// ── Product totals (all products of the business) ──────────────────────────

export interface ProductTotals {
  totalSellingPrice: number;
  totalCostPrice: number;
  productCount: number;
}

// Stock-weighted selling/cost value across EVERY product — unlike the
// inventory query, this is not filtered by costPrice, so it reflects the whole
// catalog. Each product's price and cost are multiplied by its stock on hand.
async function fetchProductTotals(): Promise<ProductTotals> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const json = await res.json();
  const raw: any[] = json?.data?.products ?? [];

  let totalSellingPrice = 0;
  let totalCostPrice = 0;
  for (const p of raw) {
    const price = typeof p?.price === "number" ? p.price : 0;
    const costPrice = typeof p?.costPrice === "number" ? p.costPrice : 0;
    const stock = typeof p?.inStock === "number" ? p.inStock : 0;
    totalSellingPrice += price * stock;
    totalCostPrice += costPrice * stock;
  }

  return {
    totalSellingPrice: Math.round(totalSellingPrice * 100) / 100,
    totalCostPrice: Math.round(totalCostPrice * 100) / 100,
    productCount: raw.length,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useProductTotalsQuery() {
  return useQuery({
    queryKey: ["product-totals"],
    queryFn: fetchProductTotals,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryQuery() {
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSalesByItemQuery(startDate?: string, endDate?: string) {
  return useQuery({
    // Distinct cache entry per range; no args → all-time (used by the charts).
    queryKey: [...SALES_KEY, startDate ?? null, endDate ?? null],
    queryFn: () => fetchSalesByItemClient(startDate, endDate),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });
}

/**
 * Provides functions to optimistically update the inventory cache and
 * rollback on error. This makes bulk (and individual) stock edits feel
 * instant in the UI instead of waiting for the refetch.
 */
export function useOptimisticInventory() {
  const queryClient = useQueryClient();

  /** Snapshot the current cache so we can rollback on error */
  const snapshot = useCallback(
    () => queryClient.getQueryData<InventoryItem[]>(INVENTORY_KEY),
    [queryClient],
  );

  /** Apply optimistic values for the given product ids */
  const applyOptimistic = useCallback(
    (
      updates: {
        id: string;
        inStock: number;
        lowStock: number;
        usesStocks?: boolean;
      }[],
    ) => {
      queryClient.setQueryData<InventoryItem[]>(INVENTORY_KEY, (old) => {
        if (!old) return old;
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        return old.map((item) => {
          const update = updateMap.get(item.id);
          if (!update) return item;
          return {
            ...item,
            inStock: update.inStock,
            lowStock: update.lowStock,
            ...(update.usesStocks !== undefined
              ? { usesStocks: update.usesStocks }
              : {}),
          };
        });
      });
    },
    [queryClient],
  );

  /** Revert the cache to a previous snapshot */
  const rollback = useCallback(
    (previous: InventoryItem[] | undefined) => {
      queryClient.setQueryData<InventoryKey>(INVENTORY_KEY, previous);
    },
    [queryClient],
  );

  return { snapshot, applyOptimistic, rollback } as const;
}

/** Type helper used by rollback above */
type InventoryKey = InventoryItem[] | undefined;

export function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SALES_KEY });
}
