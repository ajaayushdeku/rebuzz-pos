"use client";

import { Suspense, useState } from "react";
import { Box } from "lucide-react";

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
import HeaderActionButton from "@/components/ui/HeaderActionButton";

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
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      {/* ── Header ── */}

      <div className="w-full flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
            Inventory Management
          </h1>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
            Monitor stock levels and manage supply intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            storageKey="rebuzz-inventory-date-filter"
          />

          <HeaderActionButton
            variant="dashed"
            icon={Box}
            label="Add Stock"
            hideLabelOnMobile
            onClick={() => setModalOpen(true)}
          />
        </div>
      </div>

      <div
        aria-hidden
        className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
      />

      <div className="space-y-6">
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

        <ChartErrorBoundary>
          <Suspense fallback={<StockMovementChartSkeleton />}>
            <StockMovementChartWrapper />
          </Suspense>
        </ChartErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartErrorBoundary>
            <Suspense fallback={<PredictiveRestockingSkeleton />}>
              <PredictiveRestockingSuggestionsWrapper />
            </Suspense>
          </ChartErrorBoundary>

          <ChartErrorBoundary>
            <Suspense fallback={<InventoryMovementAnalysisSkeleton />}>
              <InventoryMovementAnalysisWrapper />
            </Suspense>
          </ChartErrorBoundary>
        </div>
      </div>
    </div>
  );
}
