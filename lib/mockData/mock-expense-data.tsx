// ── Expense Budget Gauges + Stat Cards ───────────────────────────────────

export type BudgetGauge = {
  category: string;
  actual: number;
  budget: number;
  pct: number;
};

export type ExpenseStatCard = {
  label: string;
  value: string;
  icon: string;
  color: string;
};

export type ExpenseCashFlowData = {
  gauges: BudgetGauge[];
  stats: ExpenseStatCard[];
};

export const mockExpenseCashFlowData: ExpenseCashFlowData = {
  gauges: [
    { category: "COGS", actual: 22000, budget: 24000, pct: 92 },
    { category: "Labor", actual: 11000, budget: 11500, pct: 96 },
    { category: "Marketing", actual: 2000, budget: 1500, pct: 133 },
    { category: "Utilities", actual: 1500, budget: 1600, pct: 94 },
    { category: "Supplies", actual: 600, budget: 800, pct: 71 },
  ],
  stats: [
    {
      label: "Total Expenses",
      value: "$44,500",
      icon: "DollarSign",
      color: "text-red-500",
    },
    {
      label: "Budgeted",
      value: "$48,000",
      icon: "Clock",
      color: "text-gray-500",
    },
    {
      label: "Budget Variance",
      value: "$3,500 under",
      icon: "TrendingDown",
      color: "text-green-500",
    },
    {
      label: "% of Revenue",
      value: "35.7%",
      icon: "Percent",
      color: "text-violet-500",
    },
    {
      label: "Purchase Returns",
      value: "$1,250",
      icon: "RefreshCcw",
      color: "text-blue-500",
    },
  ],
};

// ── Expenses by Category (Donut) ──────────────────────────────────────────

export type ExpenseCategorySlice = {
  label: string;
  value: number;
  color: string;
};

export const mockExpensesByCategoryData: ExpenseCategorySlice[] = [
  { label: "Labor", value: 18200, color: "#6366f1" },
  { label: "COGS", value: 10800, color: "#a855f7" },
  { label: "Rent", value: 6500, color: "#ec4899" },
  { label: "Utilities", value: 2800, color: "#f59e0b" },
  { label: "Marketing", value: 3200, color: "#22c55e" },
  { label: "Supplies", value: 1800, color: "#06b6d4" },
  { label: "Maintenance", value: 1200, color: "#818cf8" },
];

// ── Budget vs Actual Table ────────────────────────────────────────────────

export type BudgetActualRow = {
  category: string;
  actual: number;
  budget: number;
  pct: number;
  color: string;
};

export const mockBudgetVsActualData: BudgetActualRow[] = [
  {
    category: "Labor",
    actual: 18200,
    budget: 19000,
    pct: 96,
    color: "#6366f1",
  },
  { category: "COGS", actual: 10800, budget: 11500, pct: 94, color: "#a855f7" },
  { category: "Rent", actual: 6500, budget: 6500, pct: 100, color: "#ec4899" },
  {
    category: "Utilities",
    actual: 2800,
    budget: 3000,
    pct: 93,
    color: "#f59e0b",
  },
  {
    category: "Marketing",
    actual: 3200,
    budget: 4000,
    pct: 80,
    color: "#22c55e",
  },
  {
    category: "Supplies",
    actual: 1800,
    budget: 2000,
    pct: 90,
    color: "#06b6d4",
  },
  {
    category: "Maintenance",
    actual: 1200,
    budget: 2000,
    pct: 60,
    color: "#818cf8",
  },
];

// ── Monthly Expense Trend by Category ────────────────────────────────────

export type MonthlyExpenseTrendPoint = {
  month: string;
  Labor: number;
  COGS: number;
  Rent: number;
  Utilities: number;
  Marketing: number;
  Supplies: number;
  Maintenance: number;
};

export const mockMonthlyExpenseTrendData: MonthlyExpenseTrendPoint[] = [
  {
    month: "Sep",
    Labor: 14000,
    COGS: 9000,
    Rent: 6000,
    Utilities: 2200,
    Marketing: 2800,
    Supplies: 1600,
    Maintenance: 1200,
  },
  {
    month: "Oct",
    Labor: 16000,
    COGS: 10000,
    Rent: 6000,
    Utilities: 2400,
    Marketing: 3200,
    Supplies: 1800,
    Maintenance: 1400,
  },
  {
    month: "Nov",
    Labor: 15000,
    COGS: 9500,
    Rent: 6000,
    Utilities: 2300,
    Marketing: 2600,
    Supplies: 1500,
    Maintenance: 1100,
  },
  {
    month: "Dec",
    Labor: 17000,
    COGS: 11000,
    Rent: 6000,
    Utilities: 2800,
    Marketing: 4000,
    Supplies: 2000,
    Maintenance: 1600,
  },
  {
    month: "Jan",
    Labor: 15500,
    COGS: 10000,
    Rent: 6000,
    Utilities: 2500,
    Marketing: 3500,
    Supplies: 1700,
    Maintenance: 1300,
  },
  {
    month: "Feb",
    Labor: 15000,
    COGS: 10000,
    Rent: 6500,
    Utilities: 2600,
    Marketing: 3200,
    Supplies: 1800,
    Maintenance: 1200,
  },
];

// ── Cash Flow Trend ───────────────────────────────────────────────────────

export type CashFlowPoint = {
  month: string;
  inflow: number;
  outflow: number;
};

export const mockCashFlowData: CashFlowPoint[] = [
  { month: "Jan", inflow: 44000, outflow: 39000 },
  { month: "Feb", inflow: 48000, outflow: 41500 },
  { month: "Mar", inflow: 51000, outflow: 42000 },
  { month: "Apr", inflow: 54000, outflow: 44000 },
  { month: "May", inflow: 59000, outflow: 46500 },
  { month: "Jun", inflow: 63000, outflow: 49000 },
];

// ── Budget vs Actual Table ────────────────────────────────────────────────

export type BudgetVarianceRow = {
  category: string;
  budget: number;
  actual: number;
  variance: number; // positive = over, negative = under, 0 = on budget
};

export const mockBudgetVsActualTableData: BudgetVarianceRow[] = [
  {
    category: "Food & ingredients",
    budget: 312000,
    actual: 340000,
    variance: 28000,
  },
  { category: "Staff wages", budget: 268000, actual: 260000, variance: -8000 },
  {
    category: "Delivery commissions",
    budget: 86000,
    actual: 95000,
    variance: 9000,
  },
  { category: "Utilities & gas", budget: 40000, actual: 45000, variance: 5000 },
  { category: "Packaging", budget: 53000, actual: 52000, variance: -1000 },
  {
    category: "Marketing & ads",
    budget: 44000,
    actual: 38000,
    variance: -6000,
  },
  { category: "Rent & rates", budget: 120000, actual: 120000, variance: 0 },
];

// ── Where the Money Goes ──────────────────────────────────────────────────

export type SpendCategoryRow = {
  emoji: string;
  label: string;
  amount: number;
  changePct: number | null; // null = flat
  changeDir: "up" | "down" | "flat";
};

export type TopSupplier = {
  rank: number;
  name: string;
  amount: number;
  pctOfPurchases: number;
};

export type WhereMoneyGoesData = {
  categories: SpendCategoryRow[];
  topSuppliers: TopSupplier[];
  otherVendorsCount: number;
  otherVendorsAmount: number;
  topVendorCount: number;
  totalVendorCount: number;
  topVendorPct: number;
};

export const mockWhereMoneyGoesData: WhereMoneyGoesData = {
  categories: [
    {
      emoji: "🥬",
      label: "Food & ingredients",
      amount: 340000,
      changePct: 3.2,
      changeDir: "up",
    },
    {
      emoji: "👷",
      label: "Staff wages",
      amount: 260000,
      changePct: 0.8,
      changeDir: "down",
    },
    {
      emoji: "🏠",
      label: "Rent & rates",
      amount: 120000,
      changePct: null,
      changeDir: "flat",
    },
    {
      emoji: "🛵",
      label: "Delivery commissions",
      amount: 95000,
      changePct: 8.4,
      changeDir: "up",
    },
    {
      emoji: "📦",
      label: "Packaging",
      amount: 52000,
      changePct: 2.1,
      changeDir: "down",
    },
    {
      emoji: "🔥",
      label: "Utilities & gas",
      amount: 45000,
      changePct: 12.5,
      changeDir: "up",
    },
    {
      emoji: "📣",
      label: "Marketing & ads",
      amount: 38000,
      changePct: 6.0,
      changeDir: "down",
    },
    {
      emoji: "🧹",
      label: "Cleaning & misc",
      amount: 30000,
      changePct: 1.5,
      changeDir: "up",
    },
  ],
  topSuppliers: [
    {
      rank: 1,
      name: "Himalayan Fresh Farms",
      amount: 165000,
      pctOfPurchases: 27,
    },
    { rank: 2, name: "Nepal Dairy Co-op", amount: 98000, pctOfPurchases: 16 },
    {
      rank: 3,
      name: "Kathmandu Meat House",
      amount: 88000,
      pctOfPurchases: 14,
    },
    { rank: 4, name: "SunRise Beverages", amount: 82000, pctOfPurchases: 13 },
    {
      rank: 5,
      name: "Valley Packaging Ltd",
      amount: 78000,
      pctOfPurchases: 13,
    },
  ],
  otherVendorsCount: 15,
  otherVendorsAmount: 109000,
  topVendorCount: 5,
  totalVendorCount: 20,
  topVendorPct: 83,
};

// ── Cost Health ───────────────────────────────────────────────────────────

export type CostHealthStatus = "Healthy" | "High" | "At limit";

export type CostHealthCard = {
  emoji: string;
  label: string;
  pct: number;
  changePt: number;
  changeDir: "up" | "down";
  target: number; // max target %
  status: CostHealthStatus;
};

export type SpendOverviewData = {
  totalSpend: number;
  totalSpendChangePct: number;
  netProfit: number;
  netProfitMarginPct: number;
  fixedPct: number;
  variablePct: number;
  fixedAmount: number;
  variableAmount: number;
  fixedLabel: string;
  variableLabel: string;
};

export type CostHealthData = {
  cards: CostHealthCard[];
  overview: SpendOverviewData;
};

export const mockCostHealthData: CostHealthData = {
  cards: [
    {
      emoji: "🔍",
      label: "Food cost",
      pct: 34,
      changePt: 2.1,
      changeDir: "up",
      target: 30,
      status: "High",
    },
    {
      emoji: "👷",
      label: "Labour cost",
      pct: 26,
      changePt: 0.8,
      changeDir: "down",
      target: 30,
      status: "Healthy",
    },
    {
      emoji: "🔥",
      label: "Prime cost",
      pct: 60,
      changePt: 0.6,
      changeDir: "up",
      target: 60,
      status: "At limit",
    },
    {
      emoji: "🏠",
      label: "Occupancy",
      pct: 7,
      changePt: 0.2,
      changeDir: "down",
      target: 10,
      status: "Healthy",
    },
  ],
  overview: {
    totalSpend: 980000,
    totalSpendChangePct: 6.2,
    netProfit: 215000,
    netProfitMarginPct: 18,
    fixedPct: 42,
    variablePct: 58,
    fixedAmount: 411600,
    variableAmount: 568400,
    fixedLabel: "Rent, salaries, insurance",
    variableLabel: "Ingredients, casual labour, delivery",
  },
};

// ── Expense Insights ──────────────────────────────────────────────────────

export type ExpenseInsight = {
  emoji: string;
  label: string;
  value: string;
  description: string;
  color: string;
};

export const mockExpenseInsights: ExpenseInsight[] = [
  {
    emoji: "📈",
    label: "Highest expense day",
    value: "Friday",
    description: "Avg Rs 12,500 spent on Fridays — 23% above weekly avg",
    color: "#ef4444",
  },
  {
    emoji: "📉",
    label: "Lowest expense day",
    value: "Tuesday",
    description: "Avg Rs 7,200 spent on Tuesdays — 18% below weekly avg",
    color: "#22c55e",
  },
  {
    emoji: "🔄",
    label: "Recurring costs",
    value: "Rs 2,15,000",
    description:
      "63% of total expenses are recurring (rent, salaries, subscriptions)",
    color: "#6366f1",
  },
  {
    emoji: "⚠️",
    label: "Overspent categories",
    value: "3 categories",
    description:
      "Food cost, Delivery commissions, and Utilities exceeded budget this month",
    color: "#f59e0b",
  },
];

// ── Recurring Expenses ────────────────────────────────────────────────────

export type RecurringExpenseStatus = "active" | "paused" | "cancelled";

export type RecurringExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: "monthly" | "weekly" | "quarterly" | "yearly";
  nextDate: string;
  status: RecurringExpenseStatus;
  logo: string;
};

export const mockRecurringExpenses: RecurringExpense[] = [
  {
    id: "1",
    name: "Office Rent",
    category: "Rent",
    amount: 65000,
    frequency: "monthly",
    nextDate: "1 Falgun 2082",
    status: "active",
    logo: "🏢",
  },
  {
    id: "2",
    name: "Internet & Phone",
    category: "Utilities",
    amount: 4500,
    frequency: "monthly",
    nextDate: "15 Falgun 2082",
    status: "active",
    logo: "📡",
  },
  {
    id: "3",
    name: "Cloud Subscriptions",
    category: "Software",
    amount: 12000,
    frequency: "monthly",
    nextDate: "20 Falgun 2082",
    status: "active",
    logo: "☁️",
  },
  {
    id: "4",
    name: "Insurance Premium",
    category: "Insurance",
    amount: 85000,
    frequency: "yearly",
    nextDate: "10 Baisakh 2083",
    status: "active",
    logo: "🛡️",
  },
  {
    id: "5",
    name: "Equipment Lease",
    category: "Equipment",
    amount: 18000,
    frequency: "monthly",
    nextDate: "5 Falgun 2082",
    status: "paused",
    logo: "🔧",
  },
  {
    id: "6",
    name: "Software Licenses",
    category: "Software",
    amount: 24000,
    frequency: "quarterly",
    nextDate: "1 Chaitra 2082",
    status: "active",
    logo: "💻",
  },
];
