import { Suspense } from "react";
import Link from "next/link";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  StaffStatsSkeleton,
  StaffSalesChartSkeleton,
  StaffRevenueSkeleton,
  LatestShiftsSkeleton,
} from "@/components/dashboardComponents/staffDash/StaffSkeletons";
import EmployeeDateFilter from "@/components/dashboardComponents/staffDash/EmployeeDateFilter";
import {
  ShiftAnalysisWrapper,
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
