// ── Margin & Profit Trend with Forecast ───────────────────────────────────

export type MarginTrendPoint = {
  month: string;
  netProfit?: number;
  projectedProfit?: number;
  marginPct?: number;
  forecastMarginMin?: number;
  forecastMarginMax?: number;
  isProjected?: boolean;
};

export const mockMarginTrendData: MarginTrendPoint[] = [
  { month: "Sep", netProfit: 58000, marginPct: 33 },
  { month: "Oct", netProfit: 60000, marginPct: 36 },
  { month: "Nov", netProfit: 61000, marginPct: 40 },
  { month: "Dec", netProfit: 60500, marginPct: 38 },
  { month: "Jan", netProfit: 64000, marginPct: 43 },
  { month: "Feb", netProfit: 66000, marginPct: 46 },
  {
    month: "Mar",
    projectedProfit: 68000,
    forecastMarginMin: 46,
    forecastMarginMax: 50,
    isProjected: true,
  },
  {
    month: "Apr",
    projectedProfit: 71000,
    forecastMarginMin: 48,
    forecastMarginMax: 53,
    isProjected: true,
  },
  {
    month: "May",
    projectedProfit: 74000,
    forecastMarginMin: 50,
    forecastMarginMax: 55,
    isProjected: true,
  },
];

export const TARGET_MARGIN = 47; // percent — the dashed orange line

// ── Menu Engineering Matrix ───────────────────────────────────────────────

export type MenuCategory = "Coffee" | "Food" | "Bakery" | "Tea";

export type MenuProduct = {
  name: string;
  category: MenuCategory;
  unitsSold: number; // x-axis: popularity
  contributionMargin: number; // y-axis: profitability ($)
};

export const mockMenuEngineeringData: MenuProduct[] = [
  // Coffee — blue
  {
    name: "Espresso",
    category: "Coffee",
    unitsSold: 520,
    contributionMargin: 4.5,
  },
  {
    name: "Cappuccino",
    category: "Coffee",
    unitsSold: 700,
    contributionMargin: 4.2,
  },
  {
    name: "Cold Brew",
    category: "Coffee",
    unitsSold: 820,
    contributionMargin: 3.6,
  },
  {
    name: "Latte",
    category: "Coffee",
    unitsSold: 310,
    contributionMargin: 3.2,
  },
  // Food — orange
  {
    name: "Sandwich",
    category: "Food",
    unitsSold: 450,
    contributionMargin: 6.1,
  },
  {
    name: "Salad Bowl",
    category: "Food",
    unitsSold: 490,
    contributionMargin: 5.6,
  },
  // Bakery — purple
  {
    name: "Croissant",
    category: "Bakery",
    unitsSold: 530,
    contributionMargin: 2.1,
  },
  {
    name: "Muffin",
    category: "Bakery",
    unitsSold: 560,
    contributionMargin: 1.8,
  },
  // Tea — green
  {
    name: "Matcha Latte",
    category: "Tea",
    unitsSold: 200,
    contributionMargin: 4.9,
  },
  { name: "Chai", category: "Tea", unitsSold: 180, contributionMargin: 3.2 },
];

// Quadrant midpoints (used to draw the dividing lines)
export const MENU_MATRIX_MIDPOINTS = {
  unitsSold: 490, // median popularity
  contributionMargin: 3.9, // median profitability
};

// ── Profit Waterfall Bridge ───────────────────────────────────────────────

export type WaterfallStep = {
  label: string;
  value: number; // the running total after this deduction
  deduction: number; // how much was subtracted
  type: "start" | "deduct" | "result";
};

export const mockWaterfallData: WaterfallStep[] = [
  { label: "Gross Revenue", value: 110000, deduction: 0, type: "start" },
  { label: "COGS", value: 95000, deduction: 15000, type: "deduct" },
  { label: "Labor", value: 83000, deduction: 12000, type: "deduct" },
  { label: "Rent", value: 73000, deduction: 10000, type: "deduct" },
  { label: "Marketing", value: 68000, deduction: 5000, type: "deduct" },
  { label: "Maintenance", value: 65000, deduction: 3000, type: "deduct" },
  { label: "Net Profit", value: 65000, deduction: 0, type: "result" },
];

// ── Profit Variance Bridge ────────────────────────────────────────────────

export type VarianceBar = {
  label: string;
  value: number;
  type: "base" | "positive" | "negative" | "result";
};

export const mockVarianceData: VarianceBar[] = [
  { label: "Last Month Net", value: 62000, type: "base" },
  { label: "Volume", value: 68000, type: "positive" },
  { label: "Price/Mix", value: 70000, type: "positive" },
  { label: "COGS", value: 67000, type: "negative" },
  { label: "Labor", value: 68000, type: "negative" },
  { label: "Other", value: 67000, type: "positive" },
  { label: "This Month Net", value: 65000, type: "result" },
];
