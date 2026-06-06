import { Suspense } from "react";

import StatSkeleton from "@/components/ui/statskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";

import {
  HourlySalesTrendWrapper,
  OverviewStatsWrapper,
  RecentTransactionWrapper,
  SalesLocationChartWrapper,
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
  }>;
}) => {
  const params = await searchParams;
  const range = params.range || "month";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";

  const hasCustomDates = !!startDate && !!endDate;
  // When custom dates are active, clear the range preset
  const effectiveRange = hasCustomDates ? "" : range;

  return (
    <>
      <div className="w-full ">
        {/* ACTUAL CONTENTS */}
        <div>
          {/* Time Range Filter + Stats */}
          {/* <div className="flex items-center justify-between my-4">
            <h2 className="text-base font-semibold text-gray-900">
              Statistics Overview
            </h2>
            <CalendarDateFilter />
          </div> */}

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
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
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
                {Array.from({ length: 3 }).map((_, i) => (
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
                <SalesLocationChartWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <HourlySalesTrendWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <TopItemsWrapper />
              </Suspense>
            </ChartErrorBoundary>

            <ChartErrorBoundary>
              <Suspense fallback={<TableSkeleton rows={3} />}>
                <RecentTransactionWrapper />
              </Suspense>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
