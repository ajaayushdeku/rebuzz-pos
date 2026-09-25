import { Suspense } from "react";

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
} from "@/components/componentWrappers/SalesRevenueWrapper";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import { Plus } from "lucide-react";

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
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="flex w-full flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
            Sales & Revenue
          </h1>

          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
            Detailed breakdown of your store&lsquo;s financial performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global date range filter — single source of truth */}
          <SalesRevenueHeader />

          <HeaderActionButton
            variant="dashed"
            icon={Plus}
            hideLabelOnMobile
            label="Create Order"
            href="/invoices/add"
          />
        </div>
      </div>

      <div
        aria-hidden
        className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
      />

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

        {/* The forecast hides itself without an AI key; the target tracker
            then takes the whole row rather than half of it. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 gap-4 lg:[&>*:only-child]:col-span-2">
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

        {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-1"> */}
        <ChartErrorBoundary>
          <Suspense fallback={<PeakHoursAnalysisSkeleton />}>
            <PeakHoursAnalysisWrapper startDate={startDate} endDate={endDate} />
          </Suspense>
        </ChartErrorBoundary>
        {/* </div> */}

        {/* <div className="lg:col-span-1"> */}
        <ChartErrorBoundary>
          <Suspense fallback={<PeakDaysAnalysisSkeleton />}>
            <PeakDaysAnalysisWrapper startDate={startDate} endDate={endDate} />
          </Suspense>
        </ChartErrorBoundary>
        {/* </div>
        </div> */}

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
      </div>
    </div>
  );
}
