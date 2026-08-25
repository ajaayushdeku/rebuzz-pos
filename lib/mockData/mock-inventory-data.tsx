export type StockStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "out"
  | "overstock";

/** Soft ceiling a product's stock is measured against. */
export const MAX_STOCK = 5000;

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
  variants?: {
    id: string;
    optionValues: string[];
    price: number;
    costPrice: number;
    inStock: number;
    lowStock: number;
    isAvailable: boolean;
  }[];
};

// ── Status Logic ─────────────────────────────────────────────

/**
 * Severity first: an empty shelf outranks everything, then a shelf over the
 * ceiling, then the low-stock thresholds.
 *
 *   out       → nothing left
 *   overstock → at or above MAX_STOCK, capital sitting still
 *   critical  → at or below the product's own lowStock threshold
 *   warning   → within twice that threshold, approaching it
 *   healthy   → everything else
 */
export function getStockStatus(item: InventoryItem): StockStatus {
  if (!item.usesStocks) return "healthy";

  if (item.inStock <= 0) return "out";
  if (item.inStock >= MAX_STOCK) return "overstock";

  if (item.inStock <= item.lowStock) return "critical";
  if (item.inStock <= item.lowStock * 2) return "warning";

  return "healthy";
}

/**
 * How full the bar is — how much stock there IS, as a share of MAX_STOCK.
 *
 * This used to compute depletion (`(MAX_STOCK - inStock) / MAX_STOCK`), which
 * ran backwards: 6 units drew a 99.4% bar while 1,000 units drew none, so the
 * emptiest products looked the fullest.
 */
export function getBarPercent(item: InventoryItem): number {
  if (!item.usesStocks) return 0;

  const pct = (item.inStock / MAX_STOCK) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

/** Where the low-stock threshold sits along the bar, as a percentage. */
export function getThresholdPercent(item: InventoryItem): number {
  if (!item.usesStocks || item.lowStock <= 0) return 0;

  const pct = (item.lowStock / MAX_STOCK) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

export const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "Burger",
    unit: "volume",
    inStock: 6,
    lowStock: 10,
    usesStocks: true,
    isTaxable: true,
    isAvailable: true,
    orderedCount: 0,
    costPrice: 20,
    price: 30,
  },
  {
    id: "2",
    name: "Icecream",
    unit: "each",
    inStock: 12,
    lowStock: 5,
    usesStocks: true,
    isTaxable: true,
    isAvailable: true,
    orderedCount: 0,
    costPrice: 20,
    price: 30,
  },
  {
    id: "3",
    name: "Coffee Beans",
    unit: "each",
    inStock: 45,
    lowStock: 10,
    usesStocks: true,
    isTaxable: false,
    isAvailable: true,
    orderedCount: 8,
    costPrice: 15,
    price: 25,
  },
  {
    id: "4",
    name: "Milk",
    unit: "volume",
    inStock: 5,
    lowStock: 15,
    usesStocks: true,
    isTaxable: false,
    isAvailable: true,
    orderedCount: 12,
    costPrice: 8,
    price: 15,
  },
  {
    id: "5",
    name: "Paper Cups",
    unit: "each",
    inStock: 1200,
    lowStock: 500,
    usesStocks: true,
    isTaxable: false,
    isAvailable: true,
    orderedCount: 0,
    costPrice: 1,
    price: 2,
  },
  {
    id: "6",
    name: "Sugar",
    unit: "each",
    inStock: 8,
    lowStock: 5,
    usesStocks: true,
    isTaxable: false,
    isAvailable: true,
    orderedCount: 0,
    costPrice: 3,
    price: 5,
  },
  {
    id: "7",
    name: "Caramel Syrup",
    unit: "volume",
    inStock: 18,
    lowStock: 5,
    usesStocks: true,
    isTaxable: true,
    isAvailable: true,
    orderedCount: 6,
    costPrice: 12,
    price: 20,
  },
  {
    id: "8",
    name: "Oat Milk",
    unit: "volume",
    inStock: 3,
    lowStock: 8,
    usesStocks: true,
    isTaxable: false,
    isAvailable: true,
    orderedCount: 2,
    costPrice: 10,
    price: 18,
  },
];

export type RestockItem = {
  name: string;
  unit: string;
  suggestedRestock: number;
  priority: "High" | "Medium" | "Low";
  reason: string;
};

export const mockRestockSuggestions: RestockItem[] = [
  {
    name: "Milk",
    unit: "L",
    suggestedRestock: 35,
    priority: "High",
    reason: "Below safety stock – could run out in 2h at peak demand",
  },
  {
    name: "Coffee Beans",
    unit: "",
    suggestedRestock: 25,
    priority: "Medium",
    reason: "Predictive demand increase next weekend (+28%)",
  },
  {
    name: "Pastry Mix",
    unit: "kg",
    suggestedRestock: 12,
    priority: "High",
    reason: "Below minimum threshold for morning bake.",
  },
  {
    name: "Caramel Syrup",
    unit: "",
    suggestedRestock: 5,
    priority: "Low",
    reason: "Approaching max capacity – review ordering schedule.",
  },
];
