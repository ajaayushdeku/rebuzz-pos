import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";

import SalesRevenueHeader from "@/components/dashboardComponents/salesRevenue/SalesRevenueHeader";
import { resolveRange } from "@/components/dashboardComponents/salesRevenue/salesRevenueRange";
import {
  PeakHoursAnalysisWrapper,
  RevenueVsProfitChartWrapper,
  SalesTrendChartWrapper,
  SlowProductsWrapper,
  TopProductsWrapper,
} from "@/components/componentWrappers/SalesRevenueWrapper";

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
  const { startDate, endDate } = resolveRange({
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
            Sales & Revenue
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Detailed breakdown of your store&lsquo;s financial performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global date range filter — single source of truth */}
          <SalesRevenueHeader />

          <Button
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
            asChild
          >
            <Link href="/invoices/add">Create order</Link>
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-6 mt-6">
        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueVsProfitChartWrapper
              startDate={startDate}
              endDate={endDate}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <SalesTrendChartWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <PeakHoursAnalysisWrapper startDate={startDate} endDate={endDate} />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <TopProductsWrapper startDate={startDate} endDate={endDate} />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <SlowProductsWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>
      </div>
    </div>
  );
}
