import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";

import SalesRevenueHeader from "@/components/dashboardComponents/salesRevenue/SalesRevenueHeader";
import {
  PeakHoursAnalysisSkeleton,
  PeakDaysAnalysisSkeleton,
} from "@/components/dashboardComponents/salesRevenue/SalesRevenueSkeletons";
import { resolveRange } from "@/components/dashboardComponents/salesRevenue/salesRevenueRange";
import {
  PeakHoursAnalysisWrapper,
  PeakDaysAnalysisWrapper,
  RevenueVsProfitChartWrapper,
  SalesTrendChartWrapper,
  SlowProductsWrapper,
  TopProductsWrapper,
  TargetTrackerWrapper,
  ForecastCardWrapper,
  CampaignAnalysisWrapper,
  PriceChangeImpactWrapper,
  TimeWiseProductAnalysisWrapper,
  SalesRecommendationsAlertsWrapper,
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
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate ">
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
      <div className="flex flex-col gap-6">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 gap-4">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <ForecastCardWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <TargetTrackerWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-1">
            <ChartErrorBoundary>
              <Suspense fallback={<PeakHoursAnalysisSkeleton />}>
                <PeakHoursAnalysisWrapper
                  startDate={startDate}
                  endDate={endDate}
                />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <div className="lg:col-span-1">
            <ChartErrorBoundary>
              <Suspense fallback={<PeakDaysAnalysisSkeleton />}>
                <PeakDaysAnalysisWrapper
                  startDate={startDate}
                  endDate={endDate}
                />
              </Suspense>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 gap-4">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <TimeWiseProductAnalysisWrapper
                startDate={startDate}
                endDate={endDate}
              />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 gap-4">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <CampaignAnalysisWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <PriceChangeImpactWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        {/* Recommendations & Alerts */}
        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <SalesRecommendationsAlertsWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
