import { Suspense } from "react";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import HeatmapWrapper from "@/components/componentWrappers/HeatmapWrapper";
import HeatmapSkeleton from "@/components/dashboardComponents/overviewDash/heatmap/HeatmapSkeleton";

export default async function Page() {
  return (
    <div className="pb-4 pt-2 md:pb-8 md:pt-6 px-2 md:px-4">
      <ChartErrorBoundary>
        <Suspense fallback={<HeatmapSkeleton />}>
          <HeatmapWrapper />
        </Suspense>
      </ChartErrorBoundary>
    </div>
  );
}
