import { Suspense } from "react";

import StatSkeleton from "@/components/ui/statskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import ProfitCostHeader from "@/components/dashboardComponents/profitcostDash/ProfitCostHeader";
import {
  GrossProfitTrendChartWrapper,
  GrossVsCOGSVsNetProfitWrapper,
  ProfitPerProductWrapper,
  ProfitStatsWrapper,
  RefundAnalysisWrapper,
} from "@/components/componentWrappers/ProfitCostWrapper";

function getPresetRange(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate: start.toISOString().split("T")[0], endDate: end };
}

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
  const range = params.range ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const hasCustomDates = !!startDate && !!endDate;

  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;

  if (hasCustomDates) {
    effectiveStartDate = startDate;
    effectiveEndDate = endDate;
  } else if (range) {
    const preset = getPresetRange(range);
    effectiveStartDate = preset.startDate;
    effectiveEndDate = preset.endDate;
  }

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
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

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ProfitStatsWrapper
          startDate={effectiveStartDate}
          endDate={effectiveEndDate}
        />
      </Suspense>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <GrossProfitTrendChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <GrossVsCOGSVsNetProfitWrapper />
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
  );
}
