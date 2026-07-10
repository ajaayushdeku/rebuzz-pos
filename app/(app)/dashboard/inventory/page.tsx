"use client";

import { useInventoryQuery, useSalesByItemQuery } from "@/hooks/useInventory";
import InventoryHeader from "@/components/product/InventoryHeader";
import InventoryAlerts from "@/components/product/InventoryAlerts";
import ProductCardGrid from "@/components/product/ProductCardGrid";
import StockMovementChart from "@/components/product/StockMovementChart";
import InventoryMovementAnalysis from "@/components/product/InventoryMovementAnalysis";
import PredictiveRestockingSuggestions from "@/components/product/PredictiveRestockingSuggestions";
import InventoryValueSummary from "@/components/product/InventoryValueSummary";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { useState } from "react";
import ProductStockEditModal from "@/components/product/ProductStockEditModal";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import AIMenuSuggestions from "@/components/product/AIMenuSuggestions";
import FastSlowMovingItems from "@/components/product/FastSlowMovingItems";

/** Default revenue/profit window: last 30 days. */
function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().split("T")[0];
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: toStr(start), endDate: toStr(today) };
}

export default function InventoryPage() {
  const { data: inventory, isLoading, error } = useInventoryQuery();
  const { data: sales } = useSalesByItemQuery();

  // Shared date range — applied ONLY to the revenue/profit metrics in the
  // Inventory Valuation cards and the product cards. Everything else (stock,
  // prices, the charts below) is date-independent.
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    getDefaultDateRange(),
  );

  const [modalOpen, setModalOpen] = useState(false);

  // console.log("Inventory:", inventory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-50 px-6 py-8 md:px-10 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading inventory...</p>
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <div className="min-h-screen bg-50 px-6 py-8 md:px-10 flex items-center justify-center">
        <p className="text-red-500 text-sm">
          {error instanceof Error ? error.message : "Failed to load inventory"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* <InventoryHeader items={inventory} /> */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Inventory Management
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor stock levels and manage supply intake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              className="flex items-center gap-2 text-sm border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2"
            >
              <CalendarDays size={15} />
              Audit Log
            </Button> */}

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
        <ProductStockEditModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          items={inventory}
        />
        <InventoryValueSummary
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
        <InventoryAlerts items={inventory} />
        <ProductCardGrid
          items={inventory}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
        <div className="flex flex-col lg:flex-row gap-4 ">
          <StockMovementChart items={sales ?? []} />
          <InventoryMovementAnalysis items={sales ?? []} />
        </div>
        <PredictiveRestockingSuggestions
          inventory={inventory}
          sales={sales ?? []}
        />
        <FastSlowMovingItems />
        <AIMenuSuggestions />;
      </div>
    </div>
  );
}
