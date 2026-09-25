import { Suspense } from "react";
import Link from "next/link";

import { UserPlus } from "lucide-react";

import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  StaffStatsSkeleton,
  StaffSalesChartSkeleton,
  StaffRevenueSkeleton,
  LatestShiftsSkeleton,
} from "@/components/dashboardComponents/staffDash/StaffSkeletons";
import EmployeeDateFilter from "@/components/dashboardComponents/staffDash/EmployeeDateFilter";
import {
  StaffSalesChartWrapper,
  StaffRevenueWrapper,
  StaffStatWrapper,
  LatestShiftsWrapper,
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
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="flex w-full flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
            Employee Performance
          </h1>

          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
            Insights into employee productivity and shift efficiency.
          </p>
        </div>

        {/* ── Date range filter ── */}
        <div className="flex flex-row sm:items-center justify-between gap-3 ">
          <div className="self-end">
            <EmployeeDateFilter />
          </div>

          <button className="flex flex-row items-center rounded-md text-sm px-2.5 py-2 md:py-1.5 gap-2 bg-transparent border-dashed border-[1px] border-blue-400 text-blue-500 font-semibold hover:bg-blue-100 hover:text-blue-500 hover:border-blue-500  cursor-pointer">
            <Link
              href="/settings/employees"
              className="flex flex-row items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden lg:block">Manage Employees</span>
            </Link>
          </button>
        </div>
      </div>

      <div
        aria-hidden
        className="mb-4 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
      />

      <div className="flex flex-col gap-6">
        <ChartErrorBoundary>
          <Suspense fallback={<StaffStatsSkeleton />}>
            <StaffStatWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<StaffSalesChartSkeleton />}>
            <StaffSalesChartWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>

        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> */}
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
          <Suspense fallback={<LatestShiftsSkeleton />}>
            <LatestShiftsWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<StaffRevenueSkeleton />}>
            <StaffRevenueWrapper
              range={range}
              startDate={hasCustomDates ? startDate : undefined}
              endDate={hasCustomDates ? endDate : undefined}
            />
          </Suspense>
        </ChartErrorBoundary>
        {/* </div> */}
      </div>
    </div>
  );
};

export default Page;
