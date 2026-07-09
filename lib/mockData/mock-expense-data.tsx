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
