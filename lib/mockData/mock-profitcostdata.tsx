import {
  ExpenseApiResponse,
  ProfitCostApiResponse,
} from "@/lib/dashboardstats";
import { RefundReason } from "@/components/dashboardComponents/profitcostDash/refund-analysis-column";
import { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";
import { BudgetItem } from "@/components/dashboardComponents/profitcostDash/budget-column";
import { ExpenseCategory } from "@/components/dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import { ProfitTrendData } from "@/components/dashboardComponents/profitcostDash/GrossProfitTrendChart";

export const mockProfitStats: ProfitCostApiResponse = {
  grossRevenue: { value: 50000 },
  netProfit: { value: 30000 },
  totalRefunds: { value: 50 },
  avgMargin: { value: 60 },
};

export const mockGrossProfitTrendData: ProfitTrendData[] = [
  {
    month: "Jan",
    grossRevenue: 98000,
    netProfit: 62000,
  },
  {
    month: "Feb",
    grossRevenue: 104000,
    netProfit: 67000,
  },
  {
    month: "Mar",
    grossRevenue: 112000,
    netProfit: 71000,
  },
  {
    month: "Apr",
    grossRevenue: 108000,
    netProfit: 68000,
  },
  {
    month: "May",
    grossRevenue: 119000,
    netProfit: 74000,
  },
  {
    month: "Jun",
    grossRevenue: 125000,
    netProfit: 79000,
  },
  {
    month: "Jul",
    grossRevenue: 131000,
    netProfit: 83000,
  },
  {
    month: "Aug",
    grossRevenue: 128000,
    netProfit: 80000,
  },
  {
    month: "Sep",
    grossRevenue: 116000,
    netProfit: 72000,
  },
  {
    month: "Oct",
    grossRevenue: 122000,
    netProfit: 76000,
  },
  {
    month: "Nov",
    grossRevenue: 118000,
    netProfit: 69000,
  },
  {
    month: "Dec",
    grossRevenue: 142000,
    netProfit: 91000,
  },
];

// export const mockRefundReason: RefundReason[] = [
//   {
//     name: "Change of Heart",
//     count: 10,
//     loss: 500,
//   },
//   {
//     name: "Wrong Order",
//     count: 20,
//     loss: 1000,
//   },
//   {
//     name: "Quality Issue",
//     count: 4,
//     loss: 150,
//   },
//   {
//     name: "Out of Stock",
//     count: 10,
//     loss: 300,
//   },
// ];

export const mockProfitPerProduct: Product[] = [
  {
    name: "Coffee",
    revenue: 5000,
    cogs: 1000,
    profit: 4000,
    margin: 20,
  },
  {
    name: "Classic Latte",
    revenue: 18000,
    cogs: 5400,
    profit: 12600,
    margin: 70,
  },
  {
    name: "Avocado Toast",
    revenue: 16200,
    cogs: 5670,
    profit: 10530,
    margin: 52,
  },
  {
    name: "Cappucino",
    revenue: 14700,
    cogs: 4410,
    profit: 10290,
    margin: 70,
  },
  {
    name: "Cold Brew",
    revenue: 10800,
    cogs: 3780,
    profit: 7020,
    margin: 65,
  },
];
export const mockExpenseByCategoryData: ExpenseCategory[] = [
  {
    name: "Labor",
    value: 32000,
  },
  {
    name: "COGS",
    value: 24000,
  },
  {
    name: "Rent",
    value: 12000,
  },
  {
    name: "Utilities",
    value: 5000,
  },
  {
    name: "Marketing",
    value: 6500,
  },
  {
    name: "Supplies",
    value: 3500,
  },
  {
    name: "Maintenance",
    value: 2000,
  },
];
export const mockBudgetData: BudgetItem[] = [
  {
    category: "Labor",
    actual: 18800,
    budget: 19000,
  },
  {
    category: "COGS",
    actual: 10800,
    budget: 11500,
  },
  {
    category: "Rent",
    actual: 6500,
    budget: 6500,
  },
  {
    category: "Utilities",
    actual: 2800,
    budget: 3000,
  },
  {
    category: "Marketing",
    actual: 3200,
    budget: 4000,
  },
  {
    category: "Supplies",
    actual: 1800,
    budget: 2000,
  },
  {
    category: "Maintenance",
    actual: 1200,
    budget: 2000,
  },
];

export const mockCostStats: ExpenseApiResponse = {
  totalExpenses: { value: 50000 },
  totalBudget: { value: 47000 },
  budgetVariance: { value: 3000 },
  revenueMargin: { value: 60 },
};
