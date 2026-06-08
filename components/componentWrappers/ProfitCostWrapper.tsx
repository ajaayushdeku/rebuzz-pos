import {
  EXPENSE_STAT_CONFIG,
  PROFIT_COST_STAT_CONFIG,
  MergedSerializableConfigCostExpense,
} from "@/lib/config/dashboard";

import {
  getBudgetData,
  getExpenseByCategoryData,
  getExpenseStats,
  getGrossProfitTrendData,
  getProfitPerProduct,
  getProfitStats,
} from "@/services/dashboardServices/apiProfitCost";

import ProfitPerProduct from "../dashboardComponents/profitcostDash/ProfitPerProduct";
import RefundAnalysis from "../dashboardComponents/profitcostDash/RefundAnalysis";
import GrossProfitTrendChart from "../dashboardComponents/profitcostDash/GrossProfitTrendChart";
import ExpensesByCategoryChart from "../dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import BudgetTable from "../dashboardComponents/profitcostDash/BudgetTable";
import ProfitCostStatBoxGrid from "../dashboardComponents/profitcostDash/ProfitCostStatGrid";

export async function ProfitStatsWrapper({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  const profitStat = await getProfitStats(startDate, endDate);
  const stats: MergedSerializableConfigCostExpense[] =
    PROFIT_COST_STAT_CONFIG.map((config) => ({
      ...config,
      ...profitStat[config.key],
    }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      <ProfitCostStatBoxGrid stats={stats} />
    </div>
  );
}

export async function ProfitPerProductWrapper() {
  const profitPerProduct = await getProfitPerProduct();
  return <ProfitPerProduct products={profitPerProduct} />;
}

export function RefundAnalysisWrapper() {
  return <RefundAnalysis />;
}

export async function ExpenseStatsWrapper() {
  const expenseStat = await getExpenseStats();
  const stats: MergedSerializableConfigCostExpense[] = EXPENSE_STAT_CONFIG.map(
    (config) => ({
      ...config,
      ...expenseStat[config.key],
    }),
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      <ProfitCostStatBoxGrid stats={stats} />
    </div>
  );
}

// export async function GrossProfitTrendChartWrapper() {
//   const grossProfitData = await getGrossProfitTrendData();
//   console.log("Gross Profit Trend Data:", grossProfitData);
//   return <GrossProfitTrendChart data={grossProfitData} />;
// }

export function GrossProfitTrendChartWrapper() {
  // Chart now self-fetches via /api/dashboard/profit-trend
  return <GrossProfitTrendChart />;
}

export async function ExpenseByCategoryChartWrapper() {
  const expenseCategoryData = await getExpenseByCategoryData();
  return <ExpensesByCategoryChart data={expenseCategoryData} />;
}
export async function BudgetTableWrapper() {
  const budgetData = await getBudgetData();
  return <BudgetTable budgetData={budgetData} />;
}
