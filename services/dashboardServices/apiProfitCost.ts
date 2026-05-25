import { BudgetItem } from "@/components/dashboardComponents/profitcostDash/budget-column";
import { ExpenseCategory } from "@/components/dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import { ProfitTrendData } from "@/components/dashboardComponents/profitcostDash/GrossProfitTrendChart";
import { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";
import { RefundReason } from "@/components/dashboardComponents/profitcostDash/refund-analysis-column";
import { ProfitCostApiResponse } from "@/lib/dashboardstats";
import {
  mockBudgetData,
  mockCostStats,
  mockExpenseByCategoryData,
  mockGrossProfitTrendData,
  mockProfitPerProduct,
  mockProfitStats,
  mockRefundReason,
} from "@/lib/mockData/mock-profitcostdata";

export async function getProfitStats(): Promise<ProfitCostApiResponse> {
  return mockProfitStats;
}

export async function getExpenseStats(): Promise<ProfitCostApiResponse> {
  return mockCostStats;
}

export async function getGrossProfitTrendData(): Promise<ProfitTrendData[]> {
  return mockGrossProfitTrendData;
}
export async function getRefundReason(): Promise<RefundReason[]> {
  return mockRefundReason;
}

export async function getExpenseByCategoryData(): Promise<ExpenseCategory[]> {
  return mockExpenseByCategoryData;
}

export async function getProfitPerProduct(): Promise<Product[]> {
  return mockProfitPerProduct;
}

export async function getBudgetData(): Promise<BudgetItem[]> {
  return mockBudgetData;
}
