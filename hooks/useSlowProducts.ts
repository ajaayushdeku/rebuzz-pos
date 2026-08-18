"use client";

import { useQuery } from "@tanstack/react-query";
import { SlowProduct } from "@/components/dashboardComponents/salesRevenue/slow-product-columns";
import { formatVariantName } from "@/utils/helper";

/** Raw variant as returned inside a product's `variants` group. */
type RawVariant = {
  _id: string;
  optionValues?: string[];
  inStock?: number;
};

type RawProductLite = {
  _id: string;
  name: string;
  inStock?: number;
  variants?: { variantItems?: RawVariant[] };
};

/**
 * Normalise a sold/product name for comparison.
 *
 * Variant labels reach the API through several spellings — the picker joins
 * option values with " · " while the payload builder rewrites them to "/" — so
 * every separator is flattened to a single "/" and casing/spacing is dropped.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[·,]/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

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

  const allProducts: RawProductLite[] = productsJson?.data?.products ?? [];
  const salesItems: { itemName: string }[] = salesJson?.data ?? [];

  const soldNames = new Set<string>();
  salesItems.forEach((item) => {
    if (item?.itemName) soldNames.add(normalizeName(item.itemName));
  });

  // Does the sales report name variants at all? If no sold name carries a
  // trailing "(…)" or "[…]", it only reports parent products — in which case a
  // parent's sale has to count for all of its variants, or every variant of a
  // selling product would be flagged idle.
  const reportNamesVariants = [...soldNames].some((n) =>
    /[([].+[)\]]$/.test(n),
  );

  const skip = (name: string) => {
    const lower = name.toLowerCase();
    return lower === "customer" || lower === "custom";
  };

  const rows: SlowProduct[] = [];

  for (const product of allProducts) {
    if (skip(product.name)) continue;

    const variants = product.variants?.variantItems ?? [];
    const parentSold = soldNames.has(normalizeName(product.name));

    if (variants.length === 0) {
      if (!parentSold) {
        rows.push({
          name: product.name,
          days,
          stockAmount: product.inStock ?? 0,
        });
      }
      continue;
    }

    // Variant products hold no stock of their own — each variant is its own
    // sellable line, so each gets its own row.
    for (const variant of variants) {
      const optionValues = variant.optionValues ?? [];
      const displayName = formatVariantName(product.name, optionValues);
      const sold = reportNamesVariants
        ? soldNames.has(normalizeName(displayName))
        : parentSold;

      if (sold) continue;

      rows.push({
        name: displayName,
        days,
        stockAmount: variant.inStock ?? 0,
        productName: product.name,
        variantLabel: optionValues.filter(Boolean).join("/"),
      });
    }
  }

  return rows;
}

export function useSlowProducts(days: number) {
  return useQuery({
    queryKey: ["slow-products", days],
    queryFn: () => fetchSlowProducts(days),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
