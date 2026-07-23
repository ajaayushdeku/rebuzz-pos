import { Suspense } from "react";

import ChartSkeleton from "@/components/ui/chartskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import ProfitCostHeader from "@/components/dashboardComponents/profitcostDash/ProfitCostHeader";
import {
  ProfitStatsSkeleton,
  ProfitPerProductSkeleton,
  DayTimeProfitHeatmapSkeleton,
} from "@/components/dashboardComponents/profitcostDash/ProfitCostSkeletons";
import { resolveRange } from "@/components/dashboardComponents/profitcostDash/profitCostRange";
import {
  GrossProfitTrendChartWrapper,
  GrossVsCOGSVsNetProfitWrapper,
  PrimeCostTrackerWrapper,
  ProfitPerProductWrapper,
  ProfitStatsWrapper,
  RefundAnalysisWrapper,
  RefundBreakdownWrapper,
  WhatIfScenarioPlannerWrapper,
  BreakEvenMarginSafetyWrapper,
  UnitEconomicsWrapper,
  DayTimeProfitHeatmapWrapper,
  ProfitWaterfallBridgeWrapper,
  ProfitVarianceBridgeWrapper,
  MarginProfitForecastWrapper,
  MenuEngineeringMatrixWrapper,
  RevenueFlowSankeyWrapper,
} from "@/components/componentWrappers/ProfitCostWrapper";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const params = await searchParams;

  // Single source of truth: resolve the global date range from the URL.
  const { startDate: effectiveStartDate, endDate: effectiveEndDate } =
    resolveRange({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
    });

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Profit & Cost
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Financial health and margin analysis.
          </p>
        </div>

        <div className="self-end">
          <ProfitCostHeader />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ChartErrorBoundary>
          <Suspense fallback={<ProfitStatsSkeleton />}>
            <ProfitStatsWrapper
              startDate={effectiveStartDate}
              endDate={effectiveEndDate}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <GrossProfitTrendChartWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <GrossVsCOGSVsNetProfitWrapper
              startDate={effectiveStartDate}
              endDate={effectiveEndDate}
            />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartErrorBoundary>
            <Suspense fallback={<ProfitPerProductSkeleton />}>
              <ProfitPerProductWrapper
                startDate={effectiveStartDate}
                endDate={effectiveEndDate}
              />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={4} />}>
              <RefundAnalysisWrapper
                startDate={effectiveStartDate}
                endDate={effectiveEndDate}
              />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <ProfitWaterfallBridgeWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <ProfitVarianceBridgeWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <MenuEngineeringMatrixWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <MarginProfitForecastWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueFlowSankeyWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-[5fr_3fr] gap-6 ">
          {/* <div className="flex flex-col "> */}
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <PrimeCostTrackerWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <UnitEconomicsWrapper />
            </Suspense>
          </ChartErrorBoundary>
          {/* </div> */}
        </div>

        <div className="flex flex-col ">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <BreakEvenMarginSafetyWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <ChartErrorBoundary>
          <Suspense fallback={<DayTimeProfitHeatmapSkeleton />}>
            <DayTimeProfitHeatmapWrapper
              startDate={effectiveStartDate}
              endDate={effectiveEndDate}
            />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <WhatIfScenarioPlannerWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <RefundBreakdownWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        {/* ── Expenses Section ── */}
        {/* <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Expenses breakdown</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Expenses and budget analysis.
        </p>
      </div> */}

        {/* <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ExpenseStatsWrapper />
      </Suspense> */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartErrorBoundary>
          <Suspense fallback={<PieChartSkeleton />}>
            <ExpenseByCategoryChartWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={4} />}>
            <BudgetTableWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div> */}
      </div>
    </div>
  );
}
