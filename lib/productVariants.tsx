import type { Product } from "@/lib/types/product";

/**
 * A variant in the shape the app wants to work with.
 *
 * The products API returns `product.variants` as an OBJECT:
 *
 *   variants: {
 *     _id, productId, adminId,
 *     options: [{ title, values, _id }],
 *     variantItems: [{ optionValues, price, inStock, lowStock, costPrice, _id }]
 *   }
 *
 * The actual variants are `variants.variantItems`, and each is keyed by `_id`
 * — not `id`. Code that treats `product.variants` as an array of `{ id }`
 * silently finds nothing: `.length` is undefined, `.find` is not a function,
 * and `v.id === someId` is never true. Everything goes through here instead.
 */
export type NormalizedVariant = {
  id: string;
  optionValues: string[];
  price: number;
  inStock?: number;
  lowStock?: number;
  costPrice: number;
  isAvailable: boolean;
};

function normalize(raw: any): NormalizedVariant | null {
  const id = raw?.id ?? raw?._id;
  if (!id) return null;
  return {
    id,
    optionValues: Array.isArray(raw.optionValues) ? raw.optionValues : [],
    price: raw.price ?? 0,
    inStock: raw.inStock,
    lowStock: raw.lowStock,
    costPrice: raw.costPrice ?? 0,
    isAvailable: raw.isAvailable ?? true,
  };
}

/**
 * All variants of a product, normalized.
 *
 * Tolerates both the raw API object and an already-flattened array, so this
 * keeps working whether or not the products hook normalizes upstream.
 */
export function getVariants(
  product: Product | undefined | null,
): NormalizedVariant[] {
  const source: any = product?.variants;
  if (!source) return [];

  const list: any[] = Array.isArray(source)
    ? source
    : Array.isArray(source.variantItems)
      ? source.variantItems
      : [];

  return list.map(normalize).filter(Boolean) as NormalizedVariant[];
}

export function hasVariants(product: Product | undefined | null): boolean {
  return getVariants(product).length > 0;
}

/** Find one variant by id, accepting `id` or `_id` on the stored side. */
export function findVariant(
  product: Product | undefined | null,
  variantId: string | undefined | null,
): NormalizedVariant | undefined {
  if (!variantId) return undefined;
  return getVariants(product).find((v) => v.id === variantId);
}

/** Human label for a variant, e.g. "small · cherry". */
export function variantLabel(variant: NormalizedVariant | undefined): string {
  return variant?.optionValues.join(" · ") ?? "";
}

/** Cheapest variant price, for "From X" in the product list. */
export function lowestVariantPrice(
  product: Product | undefined | null,
): number {
  const prices = getVariants(product).map((v) => v.price);
  return prices.length ? Math.min(...prices) : 0;
}

/** Aggregate stock across a variant product's variants. */
export function variantStockSummary(product: Product | undefined | null) {
  const variants = getVariants(product);
  const totalStock = variants.reduce((sum, v) => sum + (v.inStock ?? 0), 0);
  const allOut =
    variants.length > 0 && variants.every((v) => (v.inStock ?? 0) <= 0);
  const allLow =
    variants.length > 0 &&
    variants.every((v) => {
      const stock = v.inStock ?? 0;
      const low = v.lowStock ?? 0;
      return stock <= 0 || (low > 0 && stock <= low);
    });
  return { totalStock, allOut, allLow };
}
