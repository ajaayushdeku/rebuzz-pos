"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductStockEditModal from "./ProductStockEditModal";
import { InventoryItem } from "@/lib/mockData/mock-inventory-data";

const InventoryHeader = ({ items }: { items: InventoryItem[] }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor stock levels and manage supply intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2"
          >
            <CalendarDays size={15} />
            Audit Log
          </Button>
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
        items={items}
      />
    </>
  );
};

export default InventoryHeader;
