import { Suspense } from "react";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  GrowthStatsWrapper,
  TargetVsActualWrapper,
  YearOverYearWrapper,
  GrowthByCategoryWrapper,
} from "@/components/componentWrappers/GrowthWrapper";
import { ComponentHeader } from "@/components/ComponentHeader";
import {
  GrowthStatsSkeleton,
  TargetVsActualSkeleton,
  YearOverYearSkeleton,
  GrowthByCategorySkeleton,
} from "@/components/dashboardComponents/overviewDash/growthtracker/GrowthSkeletons";

export default async function Page() {
  return (
    <div className="py-4 md:py-8 px-2 md:px-4">
      <div className="mb-4">
        <ComponentHeader
          title="Growth Tracker"
          subHeader=" Month-over-month and year-over-year performance analysis"
        />
      </div>

      <div className="flex flex-col gap-6">
        <ChartErrorBoundary>
          <Suspense fallback={<GrowthStatsSkeleton />}>
            <GrowthStatsWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<TargetVsActualSkeleton />}>
            <TargetVsActualWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<YearOverYearSkeleton />}>
            <YearOverYearWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<GrowthByCategorySkeleton />}>
            <GrowthByCategoryWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
