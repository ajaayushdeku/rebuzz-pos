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
} from "@/components/componentWrappers/GrowthWrapper";

export default async function Page() {
  return (
    <div className="py-4 md:py-8 px-2 md:px-4">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
        Growth Tracker
      </h2>
      <p className="text-xs text-gray-400 mt-0.5">
        Month-over-month and year-over-year performance analysis
      </p>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <GrowthStatsWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <div className="flex flex-wrap">
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
      </div>
    </div>
  );
}
