import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InventoryItem, MergedSalesItem } from "@/services/apiInventory";

const INVENTORY_KEY = ["inventory"] as const;
const SALES_KEY = ["salesByItem"] as const;

// ── Inventory fetcher ─────────────────────────────────────────────────────

async function fetchInventoryClient(): Promise<InventoryItem[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Failed to fetch inventory: ${res.status}`);
  const json = await res.json();
  const raw = json?.data?.products ?? [];

  return raw
    .filter((p: any) => p && typeof p.costPrice === "number" && p.costPrice > 0)
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
    );
}

// ── Sales-by-item fetcher ─────────────────────────────────────────────────

async function fetchSalesByItemClient(): Promise<MergedSalesItem[]> {
  const res = await fetch("/api/report/salesByItem");

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

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useInventoryQuery() {
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: fetchInventoryClient,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSalesByItemQuery() {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: fetchSalesByItemClient,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });
}

export function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SALES_KEY });
}
