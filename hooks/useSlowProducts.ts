"use client";

import { useQuery } from "@tanstack/react-query";
import { SlowProduct } from "@/components/dashboardComponents/salesRevenue/slow-product-columns";

async function fetchSlowProducts(days: number): Promise<SlowProduct[]> {
  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch all products and sales data in parallel via Next.js API routes
  const [productsRes, salesRes] = await Promise.all([
    fetch(`/api/products`, { cache: "no-store" }),
    fetch(`/api/report/salesByItem?startDate=${startDate}&endDate=${today}`, {
      cache: "no-store",
    }),
  ]);

  if (!productsRes.ok)
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  if (!salesRes.ok)
    throw new Error(`Failed to fetch sales: ${salesRes.status}`);

  const productsJson = await productsRes.json();
  const salesJson = await salesRes.json();

  const allProducts: { _id: string; name: string; inStock: number }[] =
    productsJson?.data?.products ?? [];
  const salesItems: { itemName: string }[] = salesJson?.data ?? [];

  // Build a set of product names that had sales in the period
  const soldNames = new Set<string>();
  salesItems.forEach((item) => soldNames.add(item.itemName));

  // Return products that had NO sales — these are slow-moving
  return allProducts
    .filter(
      (product) =>
        !soldNames.has(product.name) &&
        product.name.toLowerCase() !== "customer" &&
        product.name.toLowerCase() !== "custom",
    )
    .map((product) => ({
      name: product.name,
      days,
      stockAmount: product.inStock ?? 0,
    }));
}

export function useSlowProducts(days: number) {
  return useQuery({
    queryKey: ["slow-products", days],
    queryFn: () => fetchSlowProducts(days),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
