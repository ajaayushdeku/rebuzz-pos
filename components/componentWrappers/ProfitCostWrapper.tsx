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
  getDayTimeProfitData,
} from "@/services/dashboardServices/apiProfitCost";

import ProfitPerProduct from "../dashboardComponents/profitcostDash/ProfitPerProduct";
import RefundAnalysis from "../dashboardComponents/profitcostDash/RefundAnalysis";
import RefundBreakdown from "../dashboardComponents/profitcostDash/RefundBreakdown";
import WhatIfScenarioPlanner from "../dashboardComponents/profitcostDash/WhatIfScenarioPlanner";
import PrimeCostTracker from "../dashboardComponents/profitcostDash/PrimeCostTracker";
import BreakEvenMarginSafety from "../dashboardComponents/profitcostDash/BreakEvenMarginSafety";
import UnitEconomics from "../dashboardComponents/profitcostDash/UnitEconomics";
import DayTimeProfitHeatmap from "../dashboardComponents/profitcostDash/DayTimeProfitHeatmap";
import GrossProfitTrendChart from "../dashboardComponents/profitcostDash/GrossProfitTrendChart";
import ExpensesByCategoryChart from "../dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import BudgetTable from "../dashboardComponents/profitcostDash/BudgetTable";
import ProfitCostStatBoxGrid from "../dashboardComponents/profitcostDash/ProfitCostStatGrid";
import GrossVsCOGSVsNetProfit from "../dashboardComponents/profitcostDash/GrossVsCOGSVsNetProfit";
import ProfitWaterfallBridge from "../dashboardComponents/profitcostDash/ProfitWaterfallBridge";
import RevenueFlowSankey from "../dashboardComponents/profitcostDash/RevenueFlowSankey";
import ProfitVarianceBridge from "../dashboardComponents/profitcostDash/ProfitVarianceBridge";
import MenuEngineeringMatrix from "../dashboardComponents/profitcostDash/MenuEngineeringMatrix";
import MarginProfitForecastChart from "../dashboardComponents/profitcostDash/MarginProfitForecastChart";

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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      <ProfitCostStatBoxGrid stats={stats} />
    </div>
  );
}

export async function ProfitPerProductWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const profitPerProduct = await getProfitPerProduct();
  return (
    <ProfitPerProduct
      products={profitPerProduct}
      startDate={startDate}
      endDate={endDate}
    />
  );
}

export function RefundAnalysisWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  return <RefundAnalysis startDate={startDate} endDate={endDate} />;
}

export function RefundBreakdownWrapper() {
  return <RefundBreakdown />;
}

export function WhatIfScenarioPlannerWrapper() {
  return <WhatIfScenarioPlanner />;
}

export function PrimeCostTrackerWrapper() {
  return <PrimeCostTracker />;
}

export function BreakEvenMarginSafetyWrapper() {
  return <BreakEvenMarginSafety />;
}

export function UnitEconomicsWrapper() {
  return <UnitEconomics />;
}

export async function DayTimeProfitHeatmapWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const data = await getDayTimeProfitData(startDate, endDate);
  return <DayTimeProfitHeatmap data={data} />;
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
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 ">
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

export function GrossVsCOGSVsNetProfitWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  // Chart self-fetches via the global date range passed from the page.
  return <GrossVsCOGSVsNetProfit startDate={startDate} endDate={endDate} />;
}

export async function ExpenseByCategoryChartWrapper() {
  const expenseCategoryData = await getExpenseByCategoryData();
  return <ExpensesByCategoryChart data={expenseCategoryData} />;
}
export async function BudgetTableWrapper() {
  const budgetData = await getBudgetData();
  return <BudgetTable budgetData={budgetData} />;
}

export function MarginProfitForecastWrapper() {
  return <MarginProfitForecastChart />;
}

export function MenuEngineeringMatrixWrapper() {
  return <MenuEngineeringMatrix />;
}

export function ProfitWaterfallBridgeWrapper() {
  return <ProfitWaterfallBridge />;
}

export function ProfitVarianceBridgeWrapper() {
  return <ProfitVarianceBridge />;
}

export function RevenueFlowSankeyWrapper() {
  return <RevenueFlowSankey />;
}
