"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import {
  InventoryValueSummaryWrapper,
  InventoryAlertsWrapper,
  ProductCardGridWrapper,
  FastSlowMovingItemsWrapper,
  AIMenuSuggestionsWrapper,
  StockMovementChartWrapper,
  InventoryMovementAnalysisWrapper,
  PredictiveRestockingSuggestionsWrapper,
  ProductStockEditModalWrapper,
} from "@/components/componentWrappers/InventoryWrapper";
import {
  InventoryAlertsSkeleton,
  ProductCardGridSkeleton,
  FastSlowMovingItemsSkeleton,
  StockMovementChartSkeleton,
  InventoryMovementAnalysisSkeleton,
  PredictiveRestockingSkeleton,
} from "@/components/dashboardComponents/inventoryDash/InventorySkeletons";

/** Default revenue/profit window: last 30 days. */
function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().split("T")[0];
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: toStr(start), endDate: toStr(today) };
}

export default function InventoryPage() {
  // Shared date range — applied ONLY to the revenue/profit metrics in the
  // Inventory Valuation cards and the product cards. Everything else (stock,
  // prices, the charts below) is date-independent.
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    getDefaultDateRange(),
  );

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap- pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Inventory Management
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor stock levels and manage supply intake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />

            <Button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
            >
              <Plus size={15} />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Modal renders immediately (non-suspense) so it can open on demand. */}
        <ProductStockEditModalWrapper
          open={modalOpen}
          onOpenChange={setModalOpen}
        />

        {/* Inventory valuation — manages its own loading/empty state. */}
        <InventoryValueSummaryWrapper
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />

        <ChartErrorBoundary>
          <Suspense fallback={<InventoryAlertsSkeleton />}>
            <InventoryAlertsWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<ProductCardGridSkeleton />}>
            <ProductCardGridWrapper
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </Suspense>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Suspense fallback={<FastSlowMovingItemsSkeleton />}>
            <FastSlowMovingItemsWrapper />
          </Suspense>
        </ChartErrorBoundary>

        {/* Static suggestions — no data fetch. */}
        <AIMenuSuggestionsWrapper />

        <div className="flex flex-col lg:flex-row gap-6 ">
          <ChartErrorBoundary>
            <Suspense fallback={<StockMovementChartSkeleton />}>
              <StockMovementChartWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<InventoryMovementAnalysisSkeleton />}>
              <InventoryMovementAnalysisWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>

        <ChartErrorBoundary>
          <Suspense fallback={<PredictiveRestockingSkeleton />}>
            <PredictiveRestockingSuggestionsWrapper />
          </Suspense>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
