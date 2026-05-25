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
      <h1 className="font-bold text-[16px] md:text-xl text-gray-900 truncate">
        Growth Tracker
      </h1>
      <p className="text-gray-400 mt-0.5 text-sm md:text-base">
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
