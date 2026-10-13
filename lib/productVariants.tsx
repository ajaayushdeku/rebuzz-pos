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

/**
 * A chosen item as a customer would read it — "Momo · buff · large".
 *
 * Lives here rather than at each call site because a product id and a variant
 * id only mean something together: a variant id is unique within its product,
 * not across the catalogue, so resolving one without the other is wrong in a
 * way that looks right until two products share an id.
 *
 * Returns undefined when nothing is chosen, so callers can fall back to
 * generic wording ("a free item") instead of printing an empty name.
 */
export function productLabel(
  products: Product[],
  productId: string | undefined | null,
  variantId?: string | null,
): string | undefined {
  if (!productId) return undefined;

  const product = products.find((p) => p.id === productId);
  if (!product) return undefined;

  const label = variantLabel(findVariant(product, variantId));
  return label ? `${product.name} · ${label}` : product.name;
}

/**
 * The id an offer stores for a chosen row: the variant's where one was chosen,
 * the product's otherwise.
 *
 * A variant is something you sell in its own right — its own price, its own
 * stock — so an offer on "Coke · small · cherry" has to name that variant and
 * not the Coke it hangs off. The variant ids are ObjectIds of their own
 * (`variants.variantItems[].\u005fid`), so one stands on its own in a `products`
 * list without the parent beside it.
 */
export function offerItemId(
  productId: string,
  variantId?: string | null,
): string {
  return variantId || productId;
}

/**
 * A stored offer id back to the row that produced it.
 *
 * The id may be either kind: a product's, for an item with no variants — or
 * for an offer saved before variants were stored — and a variant's otherwise.
 * Products are checked first, so a legacy product id still resolves to the
 * product rather than falling through to the "removed" case.
 *
 * Returns undefined for an id with nothing behind it, which is what an item
 * deleted from the menu since the offer was made looks like.
 */
export function resolveOfferItem(
  products: Product[],
  id: string | undefined | null,
): { product: Product; variant?: NormalizedVariant } | undefined {
  if (!id) return undefined;

  const whole = products.find((product) => product.id === id);
  if (whole) return { product: whole };

  for (const product of products) {
    const variant = findVariant(product, id);
    if (variant) return { product, variant };
  }

  return undefined;
}

/**
 * How a stored offer id reads to a merchant — "Coke · small · cherry", or just
 * "Coke" where the id names a whole product.
 */
export function offerItemLabel(
  products: Product[],
  id: string | undefined | null,
): string | undefined {
  const hit = resolveOfferItem(products, id);
  if (!hit) return undefined;

  const label = variantLabel(hit.variant);
  return label ? `${hit.product.name} · ${label}` : hit.product.name;
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
