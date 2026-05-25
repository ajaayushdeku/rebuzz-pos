"use client";

import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Discount {
  _id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
}

interface DiscountPickerModalProps {
  open: boolean;
  onClose: () => void;
  discounts: Discount[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  title?: string;
}

export default function DiscountPickerModal({
  open,
  onClose,
  discounts,
  selectedIds,
  onApply,
  title = "Apply Discounts",
}: DiscountPickerModalProps) {
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  const filtered = useMemo(
    () =>
      discounts.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [discounts, search],
  );

  const toggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discounts..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List */}
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No discounts found
            </p>
          ) : (
            filtered.map((d) => {
              const isSelected = localSelected.includes(d._id);
              return (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => toggle(d._id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.type === "percentage" ? `${d.rate}%` : `Rs ${d.rate}`}{" "}
                      off
                    </p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Apply ({localSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
