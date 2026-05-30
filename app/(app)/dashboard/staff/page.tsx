import { Suspense } from "react";
import Link from "next/link";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import StatSkeleton from "@/components/ui/statskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  ShiftAnalysisWrapper,
  StaffOrdersChartWrapper,
  StaffRevenueWrapper,
  StaffStatWrapper,
} from "@/components/componentWrappers/StaffWrapper";

export default function Page() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Staff Performance
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Insights into employee productivity and shift efficiency.
          </p>
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold"
          asChild
        >
          <Link href="/settings/staffs">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Manage Staff
          </Link>
        </Button>
      </div>

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
          <StaffStatWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <StaffOrdersChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={3} />}>
            <ShiftAnalysisWrapper />
          </Suspense>
        </ChartErrorBoundary>
        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <StaffRevenueWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
