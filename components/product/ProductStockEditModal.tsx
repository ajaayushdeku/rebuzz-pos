"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Search, Minus, Plus, Loader2, SaveAll } from "lucide-react";

import { InventoryItem } from "@/lib/mockData/mock-inventory-data";
import {
  updateProduct,
  bulkUpdateStock,
} from "@/services/product/apiProduct.client";
import { useInvalidateInventory } from "@/hooks/useInventory";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
};

type EditItem = {
  inStock: number;
  lowStock: number;
};

export default function ProductStockEditModal({
  open,
  onOpenChange,
  items,
}: Props) {
  const invalidateInventory = useInvalidateInventory();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  // simplified local state
  const [edits, setEdits] = useState<Record<string, EditItem>>({});

  // Initialize local edits when modal opens
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, EditItem> = {};
    for (const item of items) {
      initial[item.id] = {
        inStock: item.inStock,
        lowStock: item.lowStock,
      };
    }
    setEdits(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items]);

  // search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;

    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  // update helper
  const updateField = (
    id: string,
    field: "inStock" | "lowStock",
    value: number,
  ) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: Math.max(0, value),
      },
    }));
  };

  // Check if an item has changed
  const hasChanged = (item: InventoryItem) => {
    const edit = edits[item.id];
    if (!edit) return false;
    return edit.inStock !== item.inStock || edit.lowStock !== item.lowStock;
  };

  // Count of changed items
  const changedCount = useMemo(() => {
    return items.filter(hasChanged).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, items]);

  // save one (individual)
  const handleSave = async (id: string) => {
    try {
      setSavingId(id);

      const editItem = edits[id];
      const originalItem = items.find((i) => i.id === id);

      await updateProduct(id, {
        inStock: editItem.inStock,
        lowStock: editItem.lowStock,
        ...(originalItem && !originalItem.usesStocks
          ? { usesStocks: true }
          : {}),
      });

      invalidateInventory();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  // bulk save all changed items
  const handleBulkSave = async () => {
    try {
      setBulkSaving(true);

      const changedItems = items.filter(hasChanged);

      if (changedItems.length === 0) return;

      // First, enable usesStocks for items that don't have it
      const needsStocksEnabled = changedItems.filter(
        (item) => !item.usesStocks,
      );
      for (const item of needsStocksEnabled) {
        await updateProduct(item.id, { usesStocks: true });
      }

      // Then bulk update stock quantities
      const stockPayload = changedItems.map((item) => ({
        productId: item.id,
        stockQuantity: edits[item.id].inStock,
      }));

      await bulkUpdateStock(stockPayload);

      invalidateInventory();
    } catch (err) {
      console.error("Bulk save error:", err);
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Product Stock Editor
          </DialogTitle>
        </DialogHeader>

        {/* Search + Bulk save row */}
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {changedCount > 0 && (
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
            >
              {bulkSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <SaveAll size={13} />
              )}
              Save All ({changedCount})
            </button>
          )}
        </div>

        {/* List */}
        <div className="mt-3 overflow-y-auto flex-1 space-y-2">
          {filteredItems.map((item) => {
            const edit = edits[item.id];

            if (!edit) return null;

            const changed = hasChanged(item);

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-3 flex items-center gap-4 transition-colors ${
                  changed ? "border-blue-200 bg-blue-50/50" : "border-gray-200"
                }`}
              >
                {/* Product */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>

                  <p className="text-xs text-gray-400 capitalize">
                    {item.unit}
                  </p>
                </div>

                {/* Stock */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateField(item.id, "inStock", edit.inStock - 1)
                    }
                    className="h-8 w-8 border rounded-md flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    value={edit.inStock}
                    onChange={(e) =>
                      updateField(item.id, "inStock", Number(e.target.value))
                    }
                    className="w-16 h-8 border rounded-md text-center text-sm"
                  />

                  <button
                    onClick={() =>
                      updateField(item.id, "inStock", edit.inStock + 1)
                    }
                    className="h-8 w-8 border rounded-md flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Low stock */}
                <input
                  type="number"
                  value={edit.lowStock}
                  onChange={(e) =>
                    updateField(item.id, "lowStock", Number(e.target.value))
                  }
                  className="w-16 h-8 border rounded-md text-center text-sm"
                />

                {/* Save individual */}
                <button
                  onClick={() => handleSave(item.id)}
                  disabled={!changed || savingId === item.id}
                  className={`h-8 px-4 rounded-md text-sm font-medium transition ${
                    changed
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {savingId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
