import { Suspense } from "react";
import ChartSkeleton from "@/components/ui/chartskeleton";
// import {
//   GrowthStatsWrapper,
//   TargetVsActualWrapper,
//   YearOverYearWrapper,
// } from "../../_components/GrowthWrapper";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  GrowthStatsWrapper,
  TargetVsActualWrapper,
  YearOverYearWrapper,
  GrowthByCategoryWrapper,
} from "@/components/componentWrappers/GrowthWrapper";

export default async function Page() {
  return (
    <div className="py-4 md:py-8 px-2 md:px-4">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900">Growth Tracker</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Month-over-month and year-over-year performance analysis
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <GrowthStatsWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <TargetVsActualWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <YearOverYearWrapper />
          </Suspense>
        </ChartErrorBoundary>
        {/* <YearOverYearChart data={yoyData} /> */}

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <GrowthByCategoryWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
