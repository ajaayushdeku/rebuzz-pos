import { Suspense } from "react";
import TableSkeleton from "@/components/ui/tableskeleton";
import ChartSkeleton from "@/components/ui/chartskeleton";
import PieChartSkeleton from "@/components/ui/piechartskeleton";
import StatSkeleton from "@/components/ui/statskeleton";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import CreateCustomerButton from "@/components/customer/CreateCustomerButton";
import CustomerHeader from "@/components/dashboardComponents/customersDash/CustomerHeader";
import {
  CustomerStatsWrapper,
  AtRiskCustomerWrapper,
  CustomerSegmentationChartWrapper,
  CustomerTrendChartWrapper,
  LoyaltyTierChartWrapper,
  TopCustomersWrapper,
} from "@/components/componentWrappers/CustomersWrapper";

function getPresetRange(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate: start.toISOString().split("T")[0], endDate: end };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "";
  const startDate = params.startDate ?? "";
  const endDate = params.endDate ?? "";
  const hasCustomDates = !!startDate && !!endDate;

  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;

  if (hasCustomDates) {
    effectiveStartDate = startDate;
    effectiveEndDate = endDate;
  } else if (range) {
    const preset = getPresetRange(range);
    effectiveStartDate = preset.startDate;
    effectiveEndDate = preset.endDate;
  }

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Customer Analytics
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Insights into customer behavior and retention.
          </p>
        </div>

        <div className="flex flex-row sm:items-center justify-between gap-3 ">
          <div className="self-end">
            <CustomerHeader />
          </div>
          <CreateCustomerButton />
        </div>
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
        <CustomerStatsWrapper
          startDate={effectiveStartDate}
          endDate={effectiveEndDate}
          range={range || undefined}
        />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ChartErrorBoundary>
            <Suspense fallback={<ChartSkeleton />}>
              <LoyaltyTierChartWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <div className="md:col-span-1">
          <ChartErrorBoundary>
            <Suspense fallback={<PieChartSkeleton />}>
              <CustomerSegmentationChartWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>
      </div>

      <ChartErrorBoundary>
        <Suspense fallback={<ChartSkeleton />}>
          <CustomerTrendChartWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <ChartErrorBoundary>
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <TopCustomersWrapper />
        </Suspense>
      </ChartErrorBoundary>

      <ChartErrorBoundary>
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <AtRiskCustomerWrapper />
        </Suspense>
      </ChartErrorBoundary>
    </div>
  );
}
