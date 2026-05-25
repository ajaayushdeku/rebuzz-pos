import { Suspense } from "react";
import ChartSkeleton from "@/components/ui/chartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import HeatmapWrapper from "@/components/componentWrappers/HeatmapWrapper";

export default async function Page() {
  return (
    <div className="py-4 md:py-8 px-2 md:px-4">
      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <HeatmapWrapper />
        </Suspense>
      </ChartErrorBoundary>
    </div>
  );
}
