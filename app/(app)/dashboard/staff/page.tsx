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
    <div className="w-full px-4">
      <div className="flex justify-between items-center w-full  py-2 border-b-2">
        <div className="py-4">
          {/* FOR HEADER TEXT */}
          <h1 className="font-bold text-2xl">Staff Performance</h1>
          <p className="text-gray-500">
            Insights into employee productivity and shift efficiency.
          </p>
        </div>
        <div className="mx-3">
          {/* FOR HEADER BUTTONS*/}
          <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-6 py-3 text-white rounded-2xl">
            <UserPlus />
            <Link href="/customers/add">Manage Staff</Link>
          </Button>
        </div>
      </div>

      {/* CONTENTS */}
      <div>
        <ChartErrorBoundary>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatSkeleton key={i} />
                ))}
              </div>
            }
          >
            <StaffStatWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <div className=" my-4">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <StaffOrdersChartWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
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
    </div>
  );
}
