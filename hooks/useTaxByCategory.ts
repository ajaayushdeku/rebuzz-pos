"use client";

import { useQuery } from "@tanstack/react-query";

export interface CategoryTax {
  categoryId: string;
  categoryName: string;
  color: string;
  totalTax: number;
  productCount: number;
}

interface SalesByItem {
  itemName: string;
  totalRevenue: number;
  price: number;
  count: number;
}

interface PopularProduct {
  _id: string;
  name: string;
  price: number;
  categories?: string;
  isTaxable?: boolean;
}

interface Category {
  _id: string;
  name: string;
  color?: string;
}

const UNCATEGORIZED_ID = "uncategorized";
const UNCATEGORIZED_COLOR = "#94A3B8";

/** Categories store colors as bare hex ("F87171"); prefix them for CSS. */
function normalizeColor(color?: string): string {
  if (!color) return UNCATEGORIZED_COLOR;
  return color.startsWith("#") ? color : `#${color}`;
}

/**
 * Tax generated per product category for the selected range.
 *
 * Same pattern as `useHighestTaxItems`: tax is derived per item from the
 * salesByItem report (`totalRevenue - price × count`), then each item is matched
 * to its product (popular-products list) to read its category id, resolved
 * against the categories lookup and summed per category. Products with no
 * category — or an unknown category id — fall under "Uncategorized".
 */
async function fetchTaxByCategory(
  startDate: string,
  endDate: string,
): Promise<CategoryTax[]> {
  const [salesRes, productsRes, categoriesRes] = await Promise.all([
    fetch(`/api/report/salesByItem?startDate=${startDate}&endDate=${endDate}`, {
      cache: "no-store",
    }),
    fetch(`/api/products`, { cache: "no-store" }),
    fetch(`/api/categories`, { cache: "no-store" }),
  ]);

  if (!salesRes.ok)
    throw new Error(`Failed to fetch sales by item: ${salesRes.status}`);
  if (!productsRes.ok)
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  if (!categoriesRes.ok)
    throw new Error(`Failed to fetch categories: ${categoriesRes.status}`);

  const salesJson = await salesRes.json();
  const productsJson = await productsRes.json();
  const categoriesJson = await categoriesRes.json();

  const salesItems: SalesByItem[] = salesJson?.data ?? [];
  const products: PopularProduct[] = productsJson?.data?.products ?? [];
  const categories: Category[] = categoriesJson?.data?.categories ?? [];

  // category id → { name, color }
  const categoryMap = new Map<string, { name: string; color: string }>();
  for (const c of categories) {
    categoryMap.set(c._id, {
      name: c.name ?? "Uncategorized",
      color: normalizeColor(c.color),
    });
  }

  // product name (lowercased) → product, to read its category id
  const productByName = new Map<string, PopularProduct>();
  for (const p of products) {
    productByName.set(p.name.toLowerCase(), p);
  }

  // categoryId → aggregate
  const groups = new Map<
    string,
    { name: string; color: string; totalTax: number; products: Set<string> }
  >();

  for (const item of salesItems) {
    const tax = (item.totalRevenue ?? 0) - (item.price ?? 0) * (item.count ?? 0);

    const product = productByName.get((item.itemName ?? "").toLowerCase());
    const categoryId = product?.categories;
    const resolved =
      categoryId && categoryMap.has(categoryId)
        ? { id: categoryId, ...categoryMap.get(categoryId)! }
        : {
            id: UNCATEGORIZED_ID,
            name: "Uncategorized",
            color: UNCATEGORIZED_COLOR,
          };

    const group = groups.get(resolved.id) ?? {
      name: resolved.name,
      color: resolved.color,
      totalTax: 0,
      products: new Set<string>(),
    };

    group.totalTax += tax;
    group.products.add(item.itemName);
    groups.set(resolved.id, group);
  }

  return Array.from(groups.entries())
    .map(([categoryId, g]) => ({
      categoryId,
      categoryName: g.name,
      color: g.color,
      totalTax: Math.round(g.totalTax * 100) / 100,
      productCount: g.products.size,
    }))
    .sort((a, b) => b.totalTax - a.totalTax);
}

export function useTaxByCategory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["tax-by-category", startDate, endDate],
    queryFn: () => fetchTaxByCategory(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(startDate && endDate),
  });
}
