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
  getUnitEconomics,
  getScenarioBaseline,
  getProfitWaterfall,
  getProfitVariance,
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:gap-3 lg:grid-cols-4 mt-4">
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
  // Passed through, so the first paint already covers the selected range
  // rather than the year to date the client query then replaces.
  const profitPerProduct = await getProfitPerProduct(startDate, endDate);
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

export async function WhatIfScenarioPlannerWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const baseline = await getScenarioBaseline(startDate, endDate);
  return <WhatIfScenarioPlanner baseline={baseline} />;
}

export function PrimeCostTrackerWrapper() {
  return <PrimeCostTracker />;
}

export function BreakEvenMarginSafetyWrapper() {
  // No date props: the card owns its own month picker, like the Sankey.
  return <BreakEvenMarginSafety />;
}

export async function UnitEconomicsWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const data = await getUnitEconomics(startDate, endDate);
  return <UnitEconomics data={data} />;
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

export async function ProfitWaterfallBridgeWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const data = await getProfitWaterfall(startDate, endDate);
  return <ProfitWaterfallBridge data={data} />;
}

// No date props: this card fixes itself to this calendar month against the
// last, so the page's range would have nothing to change.
export async function ProfitVarianceBridgeWrapper() {
  const data = await getProfitVariance();
  return <ProfitVarianceBridge data={data} />;
}

export function RevenueFlowSankeyWrapper() {
  return <RevenueFlowSankey />;
}
