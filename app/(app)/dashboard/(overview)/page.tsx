import { Suspense } from "react";

import StatSkeleton from "@/components/ui/statskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import WinningStatSkeleton from "@/components/ui/winningstatskeleton";
import StorySkeleton from "@/components/ui/storyskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  WeeklyRevenueChartSkeleton,
  HourlySalesTrendSkeleton,
  TopItemsSkeleton,
  RecentTransactionsSkeleton,
} from "@/components/dashboardComponents/overviewDash/OverviewSkeletons";
import {
  STAT_ROW,
  STAT_ROW_ITEM,
} from "@/components/dashboardComponents/overviewDash/statRow";

import {
  AiInsightsSection,
  HourlySalesTrendWrapper,
  LowStockAlertsWrapper,
  OverviewStatsWrapper,
  PaymentMethodsChartWrapper,
  RecentTransactionWrapper,
  SalesCategoryChartWrapper,
  TopItemsWrapper,
  WeeklyRevenueChartWrapper,
  WinningStatsWrapper,
} from "@/components/componentWrappers/OverviewWrapper";

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
      <div className="w-full dark:bg-[#0f1420] ">
        {/* ACTUAL CONTENTS */}
        <div className="flex flex-col gap-6">
          {/* Time Range Filter + Stats */}
          {/* <div className="flex items-center justify-between my-4">
            <h2 className="text-base font-semibold text-gray-900">
              Statistics Overview
            </h2>
            <CalendarDateFilter />
          </div> */}

          <ChartErrorBoundary>
            <Suspense
              fallback={
                /* The same row as the real cards — see statRow. A two-column
                   grid here would have the page re-lay-out the moment the stats
                   arrive. */
                <div className={STAT_ROW}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={STAT_ROW_ITEM}>
                      <StatSkeleton />
                    </div>
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
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense
              fallback={
                <div className={STAT_ROW}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={STAT_ROW_ITEM}>
                      <WinningStatSkeleton />
                    </div>
                  ))}
                </div>
              }
            >
              <WinningStatsWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
            <ChartErrorBoundary>
              <Suspense fallback={<WeeklyRevenueChartSkeleton />}>
                <WeeklyRevenueChartWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<PieChartSkeleton />}>
                <SalesCategoryChartWrapper
                  range={range}
                  startDate={hasCustomDates ? startDate : undefined}
                  endDate={hasCustomDates ? endDate : undefined}
                />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <ChartErrorBoundary>
            <Suspense fallback={<HourlySalesTrendSkeleton />}>
              <HourlySalesTrendWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
            <ChartErrorBoundary>
              <Suspense fallback={<TopItemsSkeleton />}>
                <TopItemsWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<PieChartSkeleton />}>
                <PaymentMethodsChartWrapper
                  range={range}
                  startDate={hasCustomDates ? startDate : undefined}
                  endDate={hasCustomDates ? endDate : undefined}
                />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
            <ChartErrorBoundary>
              <Suspense fallback={<RecentTransactionsSkeleton />}>
                <RecentTransactionWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <LowStockAlertsWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <ChartErrorBoundary>
            <Suspense fallback={<StorySkeleton />}>
              <AiInsightsSection />
            </Suspense>
          </ChartErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default Page;
