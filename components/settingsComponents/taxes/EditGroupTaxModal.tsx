"use client";

import { useState } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

const EditGroupTaxModal = ({
  open,
  onOpenChange,
  group,
  taxes,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupedTax | null;
  taxes: Tax[];
  onSave: (payload: { name: string; taxIds: string[] }) => void;
  isPending: boolean;
}) => {
  const [name, setName] = useState(group?.name ?? "");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>(
    group?.taxIds ?? [],
  );
  const [search, setSearch] = useState("");

  // Reset state when group changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && group) {
      setName(group.name);
      setSelectedTaxIds([...group.taxIds]);
      setSearch("");
    }
    onOpenChange(isOpen);
  };

  const toggleTaxId = (id: string) => {
    setSelectedTaxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getGroupRate = (taxIds: string[]) =>
    taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  const handleSave = () => {
    if (!name.trim() || selectedTaxIds.length === 0) return;
    onSave({ name, taxIds: selectedTaxIds });
  };

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title={group ? "Edit Group Tax" : "Create Group Tax"}
      description="Combine several taxes into a single group rate"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !name.trim() || selectedTaxIds.length === 0}
            className={modalPrimaryBtn}
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Group"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Details ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>
            <p className="text-xs text-gray-500">
              How this group appears when applied to a product
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Group Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Total Tax"
            className={inputClass}
          />
        </div>

        {/* ── Taxes ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Select Taxes
            </h3>
            <p className="text-xs text-gray-500">
              Their rates are added together to form the group rate
            </p>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search taxes..."
              className={`${inputClass} pl-8`}
            />
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5">
            {taxes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                No normal taxes available.
              </p>
            ) : (
              taxes
                .filter((t) =>
                  t.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((tax) => {
                  const isSelected = selectedTaxIds.includes(tax._id);
                  return (
                    <button
                      key={tax._id}
                      type="button"
                      onClick={() => toggleTaxId(tax._id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-xs">{tax.name}</p>
                        <p className="text-[11px] text-gray-400">{tax.rate}%</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* ── Combined rate ── */}
        {selectedTaxIds.length > 0 && (
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700">
                  Combined Rate
                </p>
                <p className="text-[11px] text-blue-400 mt-0.5 truncate">
                  {selectedTaxIds
                    .map((id) => {
                      const t = taxes.find((x) => x._id === id);
                      return t ? `${t.name} (${t.rate}%)` : "";
                    })
                    .join(" + ")}
                </p>
              </div>
              <p className="text-xl font-bold text-blue-700 shrink-0">
                {getGroupRate(selectedTaxIds)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </SettingsModalShell>
  );
};

export default EditGroupTaxModal;
