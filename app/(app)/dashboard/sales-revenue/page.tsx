import { Suspense } from "react";

import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";

import {
  RevenueVsProfitChartWrapper,
  SalesTrendChartWrapper,
  SlowProductsWrapper,
  TopProductsWrapper,
} from "@/components/componentWrappers/SalesRevenueWrapper";

export default async function Page() {
  return (
    <div className="p-3 md:p-6">
      {/* Actual COntent */}

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueVsProfitChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <SalesTrendChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <TopProductsWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <SlowProductsWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
