"use client";

import { useInventoryQuery, useSalesByItemQuery } from "@/hooks/useInventory";
import InventoryHeader from "@/components/product/InventoryHeader";
import InventoryAlerts from "@/components/product/InventoryAlerts";
import ProductCardGrid from "@/components/product/ProductCardGrid";
import StockMovementChart from "@/components/product/StockMovementChart";
import InventoryMovementAnalysis from "@/components/product/InventoryMovementAnalysis";
import PredictiveRestockingSuggestions from "@/components/product/PredictiveRestockingSuggestions";

export default function InventoryPage() {
  const { data: inventory, isLoading, error } = useInventoryQuery();
  const { data: sales } = useSalesByItemQuery();

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
      <div className="max-w-7xl mx-auto">
        <InventoryHeader items={inventory} />
        <InventoryAlerts items={inventory} />
        <ProductCardGrid items={inventory} />

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <StockMovementChart items={sales ?? []} />
          <InventoryMovementAnalysis items={sales ?? []} />
        </div>

        <PredictiveRestockingSuggestions
          inventory={inventory}
          sales={sales ?? []}
        />
      </div>
    </div>
  );
}
