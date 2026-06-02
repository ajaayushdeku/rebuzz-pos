import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import StatSkeleton from "@/components/ui/statskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  CustomerStatsWrapper,
  AtRiskCustomerWrapper,
  CustomerSegmentationChartWrapper,
  CustomerTrendChartWrapper,
  LoyaltyTierChartWrapper,
  TopCustomersWrapper,
} from "@/components/componentWrappers/CustomersWrapper";

export default async function Page() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Customer Analytics
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Insights into customer behavior and retention.
          </p>
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold"
          asChild
        >
          <Link href="records/customers/add">
            <UserPlus className="h-4 w-4 mr-1.5" />
            New Customer
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        }
      >
        <CustomerStatsWrapper />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartErrorBoundary>
          <Suspense fallback={<PieChartSkeleton />}>
            <CustomerSegmentationChartWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <LoyaltyTierChartWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <CustomerTrendChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <AtRiskCustomerWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <TopCustomersWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
