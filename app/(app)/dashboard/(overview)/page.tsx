import { Suspense } from "react";

import StatSkeleton from "@/components/ui/statskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";

import {
  AIBusinessStoryWrapper,
  BusinessInsightsAlertsWrapper,
  HourlySalesTrendWrapper,
  LowStockAlertsWrapper,
  OverviewStatsWrapper,
  RecentTransactionWrapper,
  TopItemsWrapper,
  WeeklyRevenueChartWrapper,
  WinningStatsWrapper,
} from "@/components/componentWrappers/OverviewWrapper";
import SalesCategoryChartWrapper from "@/components/componentWrappers/SalesCategoryChartWrapper";
import PaymentMethodsChartWrapper from "@/components/componentWrappers/PaymentMethodsWrapper";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    startDate?: string;
    endDate?: string;
    comparisonStartDate?: string;
    comparisonEndDate?: string;
  }>;
}) => {
  const params = await searchParams;
  const range = params.range || "month";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const comparisonStartDate = params.comparisonStartDate ?? "";
  const comparisonEndDate = params.comparisonEndDate ?? "";

  const hasCustomDates = !!startDate && !!endDate;
  // When custom dates are active, clear the range preset
  const effectiveRange = hasCustomDates ? "" : range;

  return (
    <>
      <div className="w-full ">
        {/* ACTUAL CONTENTS */}
        <div className="flex flex-col gap-6">
          {/* Time Range Filter + Stats */}
          {/* <div className="flex items-center justify-between my-4">
            <h2 className="text-base font-semibold text-gray-900">
              Statistics Overview
            </h2>
            <CalendarDateFilter />
          </div> */}

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 ">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatSkeleton key={i} />
                ))}
              </div>
            }
          >
            <OverviewStatsWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
              comparisonStartDate={comparisonStartDate || undefined}
              comparisonEndDate={comparisonEndDate || undefined}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 ">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatSkeleton key={i} />
                ))}
              </div>
            }
          >
            <WinningStatsWrapper />
          </Suspense>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
            <ChartErrorBoundary>
              <Suspense fallback={<ChartSkeleton />}>
                <WeeklyRevenueChartWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<PieChartSkeleton />}>
                <SalesCategoryChartWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
            <ChartErrorBoundary>
              <Suspense fallback={<ChartSkeleton />}>
                <HourlySalesTrendWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<PieChartSkeleton />}>
                <PaymentMethodsChartWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <TopItemsWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <LowStockAlertsWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={3} />}>
              <RecentTransactionWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <div className="w-full flex items-center justify-center ">
            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <AIBusinessStoryWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={3} />}>
              <BusinessInsightsAlertsWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default Page;
