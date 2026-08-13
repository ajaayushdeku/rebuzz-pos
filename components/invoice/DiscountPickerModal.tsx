"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Check, BadgePercent } from "lucide-react";
import ModalShell, { SectionLabel } from "@/components/ui/ModalShell";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CreateDiscountDialog } from "./CreateDiscount";

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
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"fixed" | "percentage">("fixed");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  // The panel stays mounted between openings, so local selection has to be
  // re-seeded each time — otherwise cancelling and reopening shows the stale
  // draft rather than what's actually applied.
  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(
    () =>
      discounts.filter(
        (d) =>
          d.type === tab && d.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [discounts, search, tab],
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
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Pick one or more discounts to apply to this invoice."
      icon={BadgePercent}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="animate-pulse">
            <CreateDiscountDialog />
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-gray-700 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border border-gray-300 hover:text-white hover:border-red-500 hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Apply ({localSelected.length})
            </button>
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(["fixed", "percentage"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setSearch("");
            }}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "fixed" ? "Fixed Amount" : "Percentage (%)"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "fixed" ? "fixed" : "percentage"} discounts...`}
          className="w-full h-9 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      <div className="mt-3 min-h-[150px] max-h-[200px] overflow-y-auto space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No {tab === "fixed" ? "fixed" : "percentage"} discounts found
          </p>
        ) : (
          filtered.map((d) => {
            const isSelected = localSelected.includes(d._id);
            return (
              <button
                key={d._id}
                type="button"
                onClick={() => toggle(d._id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {d.type === "percentage"
                      ? `${d.rate}%`
                      : formatCurrencySymbol(
                          d.rate,
                          currency.symbol,
                          currency.locale,
                        )}{" "}
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
    </ModalShell>
  );
}
