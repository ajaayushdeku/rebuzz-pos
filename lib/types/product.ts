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
