import { useCallback } from "react";
import {
  useQuery,
  useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";

export const INVENTORY_KEY = ["inventory"] as const;
const SALES_KEY = ["salesByItem"] as const;

/** Shared by every query here so freshness behaviour can't drift apart. */
const STALE_TIME = 5 * 1000;

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
          categories: p.categories,
          image:
            typeof p.image === "string" && p.image
              ? p.image
              : (p.images?.[0] ?? undefined),
          images: Array.isArray(p.images)
            ? p.images.filter(
                (s: unknown): s is string => typeof s === "string",
              )
            : undefined,
          variants:
            Array.isArray(p.variants?.variantItems) &&
            p.variants.variantItems.length > 0
              ? p.variants.variantItems.map((v: Record<string, unknown>) => ({
                  id: String(v._id ?? ""),
                  optionValues: Array.isArray(v.optionValues)
                    ? (v.optionValues as string[])
                    : [],
                  price: typeof v.price === "number" ? v.price : 0,
                  costPrice: typeof v.costPrice === "number" ? v.costPrice : 0,
                  inStock: typeof v.inStock === "number" ? v.inStock : 0,
                  lowStock: typeof v.lowStock === "number" ? v.lowStock : 0,
                  isAvailable:
                    v.isAvailable !== undefined ? Boolean(v.isAvailable) : true,
                }))
              : undefined,
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
  /** Parent products — a product with variants still counts once. */
  productCount: number;
  /** Variants across all products; products without variants contribute 0. */
  variantCount: number;
}

/**
 * Stock-weighted selling/cost value plus product and variant counts, derived
 * from the inventory list rather than a second fetch of the same endpoint.
 *
 * Deriving matters for freshness: totals used to live under their own query
 * key with their own request, so an optimistic stock edit updated the product
 * grid instantly while these cards kept showing pre-edit numbers until an
 * unrelated refetch happened. Sharing one cache entry means any update to the
 * inventory — optimistic or fetched — recomputes the totals in the same render.
 *
 * A product WITH variants carries its price and stock on the variants (the
 * base row reads 0), so value comes from the variants while the parent is
 * still counted exactly once.
 */
export function computeProductTotals(items: InventoryItem[]): ProductTotals {
  let totalSellingPrice = 0;
  let totalCostPrice = 0;
  let productCount = 0;
  let variantCount = 0;

  for (const p of items) {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;

    if (hasVariants) {
      for (const v of p.variants!) {
        const stock = typeof v.inStock === "number" ? v.inStock : 0;
        totalSellingPrice +=
          (typeof v.price === "number" ? v.price : 0) * stock;
        totalCostPrice +=
          (typeof v.costPrice === "number" ? v.costPrice : 0) * stock;
      }
      productCount += 1; // the parent, counted once
      variantCount += p.variants!.length;
    } else {
      const stock = typeof p.inStock === "number" ? p.inStock : 0;
      totalSellingPrice += (typeof p.price === "number" ? p.price : 0) * stock;
      totalCostPrice +=
        (typeof p.costPrice === "number" ? p.costPrice : 0) * stock;
      productCount += 1;
    }
  }

  return {
    totalSellingPrice: Math.round(totalSellingPrice * 100) / 100,
    totalCostPrice: Math.round(totalCostPrice * 100) / 100,
    productCount,
    variantCount,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Totals ride on the inventory cache entry — same key, same request — and are
 * computed by `select`, so there's one `/api/products` call instead of two and
 * the numbers move the moment the inventory does.
 */
export function useProductTotalsQuery() {
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    select: computeProductTotals,
  });
}

export function useInventoryQuery() {
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useSalesByItemQuery(startDate?: string, endDate?: string) {
  return useQuery({
    // Distinct cache entry per range; no args → all-time (used by the charts).
    queryKey: [...SALES_KEY, startDate ?? null, endDate ?? null],
    queryFn: () => fetchSalesByItemClient(startDate, endDate),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

// ── Suspense variants ──────────────────────────────────────────────────────
// Same cache keys as the hooks above (so non-suspense consumers share the data),
// but these suspend while loading and throw on error — letting the inventory
// page drive loading through <Suspense> and errors through <ChartErrorBoundary>.

export function useInventorySuspenseQuery() {
  return useSuspenseQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useProductTotalsSuspenseQuery() {
  return useSuspenseQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    select: computeProductTotals,
  });
}

export function useSalesByItemSuspenseQuery(
  startDate?: string,
  endDate?: string,
) {
  return useSuspenseQuery({
    queryKey: [...SALES_KEY, startDate ?? null, endDate ?? null],
    queryFn: () => fetchSalesByItemClient(startDate, endDate),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useInvalidateInventory() {
  const queryClient = useQueryClient();
  // One key now covers the product grid, the alerts and the valuation cards.
  return () => queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });
}

/**
 * Provides functions to optimistically update the inventory cache and
 * rollback on error. This makes bulk (and individual) stock edits feel
 * instant in the UI instead of waiting for the refetch.
 *
 * Because the valuation totals are derived from this same cache entry, they
 * update in the same render as the product rows.
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
