import { cookies } from "next/headers";
import {
  INVENTORY_PRODUCTS_PATH,
  mapInventoryProduct,
} from "@/lib/inventory/mapInventoryProduct";
import { authHeaders } from "./authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;
// ── Types ─────────────────────────────────────────────────────────────────

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  inStock: number;
  lowStock: number;
  usesStocks: boolean;
  isTaxable: boolean;
  isAvailable: boolean;
  orderedCount: number;
  costPrice: number;
  price: number;
  categories?: string;
  /** Ids of the master discounts applied to this product. */
  discounts?: string[];
  /** Primary product image URL (from the products API), if any. */
  image?: string;
  /** Additional gallery image URLs (the `images` field). */
  images?: string[];
  /** Variances of this product (e.g. Momo → buff/chicken/veg), if any. */
  variants?: InventoryVariant[];
};

export type InventoryVariant = {
  id: string;
  optionValues: string[];
  price: number;
  costPrice: number;
  inStock: number;
  lowStock: number;
  isAvailable: boolean;
};

export type SalesItem = {
  itemName: string;
  totalRevenue: number;
  netProfit: number;
  count: number;
  category: string | null;
  itemDiscount: number;
};

export type MergedSalesItem = {
  name: string;
  count: number;
  totalRevenue: number;
  netProfit: number;
  category: string;
};

// ── Fetch product cards (popular products) ────────────────────────────────

export async function fetchInventoryProducts(): Promise<InventoryItem[]> {
  const res = await fetch(`${BASE}${INVENTORY_PRODUCTS_PATH}`, {
    headers: await authHeaders(),
    // Fresh on every read, like the Low Stock card's own request. Cached for
    // an hour, a restocked item could still be reported to the model as out
    // of stock long after the card beside it had cleared.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch inventory products: ${res.status}`);
  }

  const json = await res.json();
  const raw = json?.data?.products ?? [];

  return raw.map(mapInventoryProduct);
}

// ── Fetch sales by item (for chart + analysis) ────────────────────────────

export async function fetchSalesByItem(): Promise<MergedSalesItem[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) throw new Error(`Failed to fetch sales by item: ${res.status}`);

  const json = await res.json();
  const rawItems: SalesItem[] = json?.data ?? [];

  if (rawItems.length === 0) return [];

  // Merge duplicates — same product sold at different prices
  const merged = rawItems.reduce<
    Record<
      string,
      {
        count: number;
        totalRevenue: number;
        netProfit: number;
        category: string;
      }
    >
  >((acc, item) => {
    if (acc[item.itemName]) {
      acc[item.itemName].count += item.count;
      acc[item.itemName].totalRevenue += item.totalRevenue;
      acc[item.itemName].netProfit += item.netProfit;
    } else {
      acc[item.itemName] = {
        count: item.count,
        totalRevenue: item.totalRevenue,
        netProfit: item.netProfit,
        category: item.category ?? "Uncategorized",
      };
    }
    return acc;
  }, {});

  // console.log("Total Sales:", merged);

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
