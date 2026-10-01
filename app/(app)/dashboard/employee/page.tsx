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
import PageHeader from "@/components/ui/PageHeader";

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
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10 dark:bg-[#0f1420]">
      <PageHeader
        className="mb-4"
        title="Employee Performance"
        subtitle="Insights into employee productivity and shift efficiency."
        actions={
          <div className="flex flex-row sm:items-center justify-between gap-3 ">
            <div className="self-end">
              <EmployeeDateFilter />
            </div>

            <button className="inline-flex h-9 shrink-0 cursor-pointer border border-dashed border-blue-300 bg-red bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 select-none items-center justify-center gap-2 tracking-wide whitespace-nowrap rounded-lg  px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 dark:border-[#7ba2e3]/40 dark:bg-white/5 dark:text-[#7ba2e3] dark:hover:border-[#7ba2e3]/60 dark:hover:bg-white/10">
              <Link
                href="/settings/employees"
                className="flex flex-row items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden lg:block">Manage Employees</span>
              </Link>
            </button>
          </div>
        }
        spaceBelow={false}
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
