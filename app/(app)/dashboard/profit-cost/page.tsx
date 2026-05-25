import { Suspense } from "react";
import { TrendingUp } from "lucide-react";

// import {
//   BudgetTableWrapper,
//   ExpenseByCategoryChartWrapper,
//   ExpenseStatsWrapper,
//   GrossProfitTrendChartWrapper,
//   ProfitPerProductWrapper,
//   ProfitStatsWrapper,
//   RefundAnalysisWrapper,
// } from "../_components/ProfitCostWrapper";
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
    <div className="p-3 md:p-6">
      <div className="flex justify-between items-center w-full  py-2 border-b-2">
        <div className="py-2 min-w-0">
          {/* FOR HEADER TEXT */}
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Profit & Cost
          </h1>
          <p className="text-gray-500 text-sm md:text-base hidden sm:block">
            Financial health and margin analysis.
          </p>
        </div>
        <div className="shrink-0">
          {/* FOR HEADER BUTTONS*/}
          <Button className="bg-blue-600 hover:bg-blue-700 px-3 md:px-6 py-3 text-white rounded-2xl">
            <TrendingUp className="shrink-0" />
            Optimize Margins
          </Button>
        </div>
      </div>

      <div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
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
      </div>

      <div>
        <div className=" py-4 border-b-2">
          <h1 className="font-bold text-xl md:text-2xl truncate ">
            Expenses breakdown
          </h1>

          <p className="text-gray-500 text-sm md:text-base hidden sm:block">
            Expenses and budget analysis.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
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
    </div>
  );
}
