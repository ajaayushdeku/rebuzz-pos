// export type StockStatus = "healthy" | "warning" | "critical" | "overstock";

// export type InventoryItem = {
//   id: string;
//   name: string;
//   unit: string; // soldBy → "each" | "volume"
//   inStock: number; // current stock
//   lowStock: number; // threshold
//   usesStocks: boolean;
//   isTaxable: boolean;
//   isAvailable: boolean;
//   orderedCount: number;
//   costPrice: number;
//   price: number;
// };

// // Derive status from thresholds — no maxStock needed
// export function getStockStatus(item: InventoryItem): StockStatus {
//   if (!item.usesStocks) return "healthy";
//   if (item.inStock <= item.lowStock) return "critical";
//   if (item.inStock <= item.lowStock * 2) return "warning";
//   return "healthy";
// }

// // Bar fills relative to lowStock * 4 as soft upper reference
// export function getBarPercent(item: InventoryItem): number {
//   if (!item.usesStocks || item.lowStock === 0) return 100;
//   return Math.min((item.inStock / (item.lowStock * 4)) * 100, 100);
// }

export type StockStatus = "healthy" | "warning" | "critical" | "out";

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
  /** Primary product image URL (from the products API), if any. */
  image?: string;
  /** Additional gallery image URLs (the `images` field). */
  images?: string[];
};

// ── Status Logic ─────────────────────────────────────────────
export function getStockStatus(item: InventoryItem): StockStatus {
  if (!item.usesStocks) return "healthy";

  if (item.inStock <= 0) return "out";

  if (item.inStock <= item.lowStock) {
    return "critical";
  }

  if (item.inStock <= item.lowStock * 2) {
    return "warning";
  }

  return "healthy";
}

export function getBarPercent(item: InventoryItem): number {
  if (!item.usesStocks) return 0;

  // reference stock level
  const reference = 1000;

  if (reference <= 0) return 0;

  // depletion percentage
  const depletion = ((reference - item.inStock) / reference) * 100;

  return Math.min(Math.max(depletion, 0), 100);
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
