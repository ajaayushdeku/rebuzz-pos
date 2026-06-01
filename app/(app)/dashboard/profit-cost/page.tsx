import { Suspense } from "react";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import StatSkeleton from "@/components/ui/statskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  BudgetTableWrapper,
  ExpenseByCategoryChartWrapper,
  ExpenseStatsWrapper,
  GrossProfitTrendChartWrapper,
  ProfitPerProductWrapper,
  ProfitStatsWrapper,
  RefundAnalysisWrapper,
} from "@/components/componentWrappers/ProfitCostWrapper";

export default async function Page() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Profit & Cost
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Financial health and margin analysis.
          </p>
        </div>

        {/* <div className="flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Optimize Margins
          </Button>
        </div> */}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ProfitStatsWrapper />
      </Suspense>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <GrossProfitTrendChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={4} />}>
            <ProfitPerProductWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={4} />}>
            <RefundAnalysisWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>

      {/* ── Expenses Section ── */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Expenses breakdown</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Expenses and budget analysis.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ExpenseStatsWrapper />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}
