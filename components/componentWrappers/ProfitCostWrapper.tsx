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
  getRefundReason,
} from "@/services/dashboardServices/apiProfitCost";

import StatBox from "../dashboardComponents/StatBox";
import ProfitPerProduct from "../dashboardComponents/profitcostDash/ProfitPerProduct";
import RefundAnalysis from "../dashboardComponents/profitcostDash/RefundAnalysis";
import StatBoxGrid from "../dashboardComponents/profitcostDash/ProfitCostStatGrid";
import GrossProfitTrendChart from "../dashboardComponents/profitcostDash/GrossProfitTrendChart";
import ExpensesByCategoryChart from "../dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import BudgetTable from "../dashboardComponents/profitcostDash/BudgetTable";

export async function ProfitStatsWrapper() {
  const profitStat = await getProfitStats();
  const stats: MergedSerializableConfigCostExpense[] =
    PROFIT_COST_STAT_CONFIG.map((config) => ({
      ...config,
      ...profitStat[config.key],
    }));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      {stats.map(({ key, ...stat }) => (
        <StatBox key={key} {...stat} />
      ))}
    </div>
  );
}

export async function ProfitPerProductWrapper() {
  const profitPerProduct = await getProfitPerProduct();
  return <ProfitPerProduct products={profitPerProduct} />;
}

export async function RefundAnalysisWrapper() {
  const refundData = await getRefundReason();
  return <RefundAnalysis refundReasons={refundData} />;
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
      <StatBoxGrid stats={stats} />
    </div>
  );
}

export async function GrossProfitTrendChartWrapper() {
  const grossProfitData = await getGrossProfitTrendData();
  return <GrossProfitTrendChart data={grossProfitData} />;
}

export async function ExpenseByCategoryChartWrapper() {
  const expenseCategoryData = await getExpenseByCategoryData();
  return <ExpensesByCategoryChart data={expenseCategoryData} />;
}
export async function BudgetTableWrapper() {
  const budgetData = await getBudgetData();
  return <BudgetTable budgetData={budgetData} />;
}
