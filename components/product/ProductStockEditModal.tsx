"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // Track whether edits have been initialized for the current modal session
  const initializedForOpen = useRef(false);

  // simplified local state
  const [edits, setEdits] = useState<Record<string, EditItem>>({});

  // Initialize local edits ONLY when modal opens, not when items change
  useEffect(() => {
    if (open && !initializedForOpen.current) {
      const initial: Record<string, EditItem> = {};
      for (const item of items) {
        initial[item.id] = {
          inStock: item.inStock,
          lowStock: item.lowStock,
        };
      }
      setEdits(initial);
      initializedForOpen.current = true;
    }
    if (!open) {
      initializedForOpen.current = false;
    }
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

      // Sync this item's edit to the saved values so hasChanged returns false
      // even before the items prop updates
      setEdits((prev) => ({
        ...prev,
        [id]: { inStock: editItem.inStock, lowStock: editItem.lowStock },
      }));

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

      // Sync all changed items' edits to their saved values
      setEdits((prev) => {
        const updated = { ...prev };
        for (const item of changedItems) {
          updated[item.id] = {
            inStock: edits[item.id].inStock,
            lowStock: edits[item.id].lowStock,
          };
        }
        return updated;
      });

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

        {/* Table header */}
        <div className="mt-3 grid grid-cols-[1fr_120px_80px_80px] items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
          <span>Product</span>
          <span className="text-left">In Stock</span>
          <span className="text-left">Low Stock</span>
          <span className="text-center">Actions</span>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {filteredItems.map((item) => {
            const edit = edits[item.id];

            if (!edit) return null;

            const changed = hasChanged(item);

            return (
              <div
                key={item.id}
                className={`grid grid-cols-[1fr_120px_80px_80px] items-center gap-3 px-3 py-3 transition-colors ${
                  changed ? "bg-blue-50/50" : "hover:bg-gray-50"
                }`}
              >
                {/* Product */}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {item.unit}
                  </p>
                </div>

                {/* In Stock */}
                <div className="flex items-center justify-center gap-0.5">
                  <button
                    onClick={() =>
                      updateField(item.id, "inStock", edit.inStock - 1)
                    }
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition shrink-0"
                  >
                    <Minus size={12} />
                  </button>

                  <input
                    type="number"
                    value={edit.inStock}
                    onChange={(e) =>
                      updateField(item.id, "inStock", Number(e.target.value))
                    }
                    className="w-12 h-6 border rounded-md text-center text-xs"
                  />

                  <button
                    onClick={() =>
                      updateField(item.id, "inStock", edit.inStock + 1)
                    }
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition shrink-0"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Low Stock */}
                <div className="flex items-center justify-center">
                  <input
                    type="number"
                    value={edit.lowStock}
                    onChange={(e) =>
                      updateField(item.id, "lowStock", Number(e.target.value))
                    }
                    className="w-14 h-7 border rounded-md text-center text-sm"
                  />
                </div>

                {/* Save individual */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleSave(item.id)}
                    disabled={!changed || savingId === item.id}
                    className={`h-7 px-3 rounded-md text-xs font-medium transition ${
                      changed
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {savingId === item.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
