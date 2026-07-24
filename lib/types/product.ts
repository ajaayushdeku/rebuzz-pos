export interface ProductVariant {
  id: string;
  /** e.g. ["buff"] or ["large", "spicy"] — one value per option group. */
  optionValues: string[];
  price: number;
  costPrice?: number;
  inStock?: number;
  lowStock?: number;
  isAvailable?: boolean;
}

export interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
  categories: string;
  description?: string;
  costPrice?: number;
  discounts?: string[];
  isTaxable: boolean;
  usesStocks: boolean;
  inStock?: number;
  lowStock?: number;
  soldBy?: "each" | "volume" | "";
  /** Present when the product is sold in variances (e.g. Momo → buff/chicken/veg). */
  variants?: ProductVariant[];
}

export type RawProduct = {
  isVeg: boolean;
  isAvailable: boolean;
  usesOfferPrice: boolean;
  addons: unknown[];
  categories?: string;
  _id: string;
  name: string;
  price: number;
  added_by: string;
  image?: string;
  images: unknown[];
  description: string;
  inStock: number;
  lowStock: number;
  usesStocks: boolean;
  sku: string;
  adminId: string;
  costPrice: number;
  tags: unknown[];
  soldBy: string;
  orderedCount: number;
  isTaxable: boolean;
  usesCompositeItems: boolean;
  compositeItems: null;
  showInOrdering: boolean;
  discounts: string[];
  discountType: string;
  isLocked: boolean;
  variants?: RawVariantGroup;
};

export type RawVariantItem = {
  isAvailable: boolean;
  optionValues: string[];
  price: number;
  costPrice: number;
  _id: string;
  inStock: number;
  lowStock: number;
};

export type RawVariantGroup = {
  _id: string;
  productId: string;
  adminId: string;
  options: { values: string[]; _id: string; title: string }[];
  variantItems: RawVariantItem[];
};

export function mapRawProductToProduct(raw: RawProduct): Product {
  return {
    id: raw._id,
    name: raw.name,
    image: raw.image ?? undefined,
    price: raw.price,
    // ✅ backend uses both "categories" and "category" — handle both
    categories: raw.categories ?? "",
    description: raw.description ?? "",
    costPrice: raw.costPrice ?? 0,
    discounts: (raw.discounts ?? []) as string[],
    // ── previously missing — root cause of the bug ──
    isTaxable: raw.isTaxable ?? false,
    usesStocks: raw.usesStocks ?? false,
    inStock: raw.inStock ?? 0,
    lowStock: raw.lowStock ?? 0,
    soldBy: (raw.soldBy as "each" | "volume" | "") ?? "",
    variants: raw.variants?.variantItems?.map((v) => ({
      id: v._id,
      optionValues: v.optionValues ?? [],
      price: v.price ?? 0,
      costPrice: v.costPrice ?? 0,
      inStock: v.inStock ?? 0,
      lowStock: v.lowStock ?? 0,
      isAvailable: v.isAvailable ?? true,
    })),
  };
}

export type RawProductListResponse = {
  status: string;
  data: {
    products: RawProduct[];
  };
};

export interface CreateProductInput {
  name: string;
  price: number;
  costPrice: number;
  description?: string;
  category?: string;
  image?: string;
  isTaxable?: boolean;
  usesStocks?: boolean;
  inStock?: number;
  lowStock?: number;
  soldBy?: "each" | "volume" | "";
  isAiImageEnabled?: boolean;
  isUnsplashImageEnabled?: boolean;
  showInOrdering?: boolean;
  discountType?: string;
}

export interface ProductRowProps {
  product: Product;
}
