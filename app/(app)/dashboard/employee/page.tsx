import { Suspense } from "react";
import Link from "next/link";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import StatSkeleton from "@/components/ui/statskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";
import {
  ShiftAnalysisWrapper,
  StaffSalesChartWrapper,
  StaffRevenueWrapper,
  StaffStatWrapper,
  LatestShiftsWrapper,
  StaffingRecommendationsWrapper,
} from "@/components/componentWrappers/StaffWrapper";

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
  const range = params.range ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";

  // When custom dates are provided, we pass them directly and ignore range preset
  const hasCustomDates = !!startDate && !!endDate;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Employee Performance
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Insights into employee productivity and shift efficiency.
          </p>
        </div>

        {/* ── Calendar + Quick date filter ── */}
        <div className="flex flex-row sm:items-center justify-between gap-3 ">
          <div className="self-end">
            <CalendarDateFilter />
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold "
            asChild
          >
            <Link href="/settings/staffs">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Manage Staff
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ChartErrorBoundary>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatSkeleton key={i} />
                ))}
              </div>
            }
          >
            <StaffStatWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <StaffSalesChartWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={3} />}>
            <ShiftAnalysisWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary> */}
          <ChartErrorBoundary>
            <Suspense fallback={<TableSkeleton rows={3} />}>
              <LatestShiftsWrapper
                range={range}
                startDate={hasCustomDates ? startDate : undefined}
                endDate={hasCustomDates ? endDate : undefined}
              />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <StaffRevenueWrapper
                range={range}
                startDate={hasCustomDates ? startDate : undefined}
                endDate={hasCustomDates ? endDate : undefined}
              />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <StaffingRecommendationsWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
};

export default Page;
