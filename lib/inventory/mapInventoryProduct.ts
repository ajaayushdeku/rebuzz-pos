import type { InventoryItem } from "@/services/apiInventory";

/**
 * Where every product list that needs stock figures is read from.
 *
 * The backend has two product list endpoints, and only this one carries each
 * variant's own stock. The AI briefing used to read the plain
 * `/business/products` list instead, so a product whose stock lives on its
 * variants arrived with no variants at all. Its own stock figure, which is
 * always zero for such a product, was then reported to the model as the
 * product being out of stock — while the Low Stock card beside it, reading
 * this endpoint, correctly showed the variants were stocked.
 */
export const INVENTORY_PRODUCTS_PATH = "/business/products/popular";

/**
 * One raw product from that endpoint, as the app's inventory item.
 *
 * Shared by the browser's inventory hook and the server's AI briefing. The two
 * used to carry identical copies of this mapping, and identical copies are
 * one edit away from reporting different stock for the same product.
 *
 * Kept free of server-only imports so the browser bundle can use it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInventoryProduct(p: any): InventoryItem {
  return {
    id: p._id,
    name: p.name ?? "Unnamed Product",
    unit: p.soldBy ?? "each",
    inStock: typeof p.inStock === "number" ? p.inStock : 0,
    lowStock: typeof p.lowStock === "number" ? p.lowStock : 0,
    usesStocks: Boolean(p.usesStocks),
    isTaxable: Boolean(p.isTaxable),
    isAvailable: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
    orderedCount: typeof p.orderedCount === "number" ? p.orderedCount : 0,
    costPrice: p.costPrice,
    price: typeof p.price === "number" ? p.price : 0,
    categories: p.categories,
    discounts: Array.isArray(p.discounts)
      ? p.discounts.filter((d: unknown): d is string => typeof d === "string")
      : undefined,
    image:
      typeof p.image === "string" && p.image
        ? p.image
        : (p.images?.[0] ?? undefined),
    images: Array.isArray(p.images)
      ? p.images.filter((s: unknown): s is string => typeof s === "string")
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
  };
}
