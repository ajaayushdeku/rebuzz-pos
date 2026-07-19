"use client";

import {
  useInventoryQuery,
  useInventorySuspenseQuery,
  useSalesByItemSuspenseQuery,
} from "@/hooks/useInventory";

import InventoryValueSummary from "@/components/dashboardComponents/inventoryDash/InventoryValueSummary";
import InventoryAlerts from "@/components/dashboardComponents/inventoryDash/InventoryAlerts";
import ProductCardGrid from "@/components/dashboardComponents/inventoryDash/ProductCardGrid";
import FastSlowMovingItems from "@/components/dashboardComponents/inventoryDash/FastSlowMovingItems";
import AIMenuSuggestions from "@/components/dashboardComponents/inventoryDash/AIMenuSuggestions";
import StockMovementChart from "@/components/dashboardComponents/inventoryDash/StockMovementChart";
import InventoryMovementAnalysis from "@/components/dashboardComponents/inventoryDash/InventoryMovementAnalysis";
import PredictiveRestockingSuggestions from "@/components/dashboardComponents/inventoryDash/PredictiveRestockingSuggestions";
import ProductStockEditModal from "@/components/dashboardComponents/inventoryDash/ProductStockEditModal";

/**
 * Wrappers for the inventory dashboard components. The data-driven wrappers use
 * the *suspense* query hooks (deduped by query key), so each one suspends while
 * loading and throws on error — the page drives loading via <Suspense> and
 * errors via <ChartErrorBoundary>. The modal keeps the non-suspense hook since
 * it must render immediately regardless of fetch state.
 */

interface DateRangeProps {
  startDate: string;
  endDate: string;
}

export const InventoryValueSummaryWrapper = ({
  startDate,
  endDate,
}: DateRangeProps) => {
  return <InventoryValueSummary startDate={startDate} endDate={endDate} />;
};

export const InventoryAlertsWrapper = () => {
  const { data: inventory } = useInventorySuspenseQuery();
  return <InventoryAlerts items={inventory} />;
};

export const ProductCardGridWrapper = ({
  startDate,
  endDate,
}: DateRangeProps) => {
  const { data: inventory } = useInventorySuspenseQuery();
  return (
    <ProductCardGrid
      items={inventory}
      startDate={startDate}
      endDate={endDate}
    />
  );
};

export const FastSlowMovingItemsWrapper = () => {
  const { data: sales } = useSalesByItemSuspenseQuery();
  return <FastSlowMovingItems items={sales} />;
};

export const AIMenuSuggestionsWrapper = () => {
  return <AIMenuSuggestions />;
};

export const StockMovementChartWrapper = () => {
  const { data: sales } = useSalesByItemSuspenseQuery();
  return <StockMovementChart items={sales} />;
};

export const InventoryMovementAnalysisWrapper = () => {
  const { data: sales } = useSalesByItemSuspenseQuery();
  return <InventoryMovementAnalysis items={sales} />;
};

export const PredictiveRestockingSuggestionsWrapper = () => {
  const { data: inventory } = useInventorySuspenseQuery();
  const { data: sales } = useSalesByItemSuspenseQuery();
  return (
    <PredictiveRestockingSuggestions inventory={inventory} sales={sales} />
  );
};

export const ProductStockEditModalWrapper = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { data: inventory = [] } = useInventoryQuery();
  return (
    <ProductStockEditModal
      open={open}
      onOpenChange={onOpenChange}
      items={inventory}
    />
  );
};
