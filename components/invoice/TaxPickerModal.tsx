"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Layers, Receipt } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import { CreateTaxDialog } from "./CreateTaxRate";

type TaxTab = "normal" | "group";

interface TaxPickerModalProps {
  open: boolean;
  onClose: () => void;
  taxes: Tax[];
  groupedTaxes: GroupedTax[];
  isLoading: boolean;
  togglingId: string | null;
  togglingTax: boolean;
  onToggle: (
    taxId: string,
    currentlyEnabled: boolean,
    isGroup?: boolean,
  ) => void;
}

export default function TaxPickerModal({
  open,
  onClose,
  taxes,
  groupedTaxes,
  isLoading,
  togglingId,
  togglingTax,
  onToggle,
}: TaxPickerModalProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TaxTab>("normal");

  // Clear the query each time it opens, so a stale filter doesn't hide
  // everything on the next visit.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filteredNormal = useMemo(
    () =>
      taxes.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [taxes, search],
  );

  const filteredGroup = useMemo(
    () =>
      groupedTaxes.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [groupedTaxes, search],
  );

  // Resolve combined rate for a grouped tax
  const getGroupRate = (group: GroupedTax): number =>
    group.taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  const getGroupTaxNames = (group: GroupedTax): string =>
    group.taxIds
      .map((id) => {
        const t = taxes.find((x) => x._id === id);
        return t ? `${t.name} (${t.rate}%)` : "";
      })
      .filter(Boolean)
      .join(", ");

  const TaxToggle = ({
    isEnabled,
    isThisToggling,
    disabled,
    onClick,
  }: {
    isEnabled: boolean;
    isThisToggling: boolean;
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        isEnabled ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      {isThisToggling ? (
        <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      )}
    </button>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Select Tax"
      subtitle="Choose a tax to apply to this invoice."
      icon={Receipt}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="animate-pulse">
            <CreateTaxDialog />
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(["normal", "group"] as TaxTab[]).map((t) => (
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
            {t === "normal" ? "Normal Taxes" : "Group Taxes"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "normal" ? "taxes" : "group taxes"}...`}
          className="w-full h-9 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      <div className="mt-3 min-h-[150px] max-h-[200px] overflow-y-auto space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading taxes...
          </div>
        ) : tab === "normal" ? (
          filteredNormal.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No taxes found
            </p>
          ) : (
            filteredNormal.map((tax) => {
              const isThisToggling = togglingId === tax._id;
              return (
                <div
                  key={tax._id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    tax.isEnabled
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {tax.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{tax.rate}%</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tax.isEnabled && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <TaxToggle
                      isEnabled={tax.isEnabled}
                      isThisToggling={isThisToggling}
                      disabled={
                        isThisToggling || (togglingTax && !isThisToggling)
                      }
                      onClick={() => onToggle(tax._id, tax.isEnabled, false)}
                    />
                  </div>
                </div>
              );
            })
          )
        ) : filteredGroup.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No group taxes found
          </p>
        ) : (
          filteredGroup.map((group) => {
            const isThisToggling = togglingId === group._id;
            const groupRate = getGroupRate(group);
            const groupNames = getGroupTaxNames(group);
            return (
              <div
                key={group._id}
                className={`px-3 py-2.5 rounded-lg border transition-colors ${
                  group.isEnabled
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Layers size={12} className="text-blue-500 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {group.name}
                      </p>
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                        {groupRate}%
                      </span>
                    </div>
                    {groupNames && (
                      <p className="text-xs text-gray-400 truncate ml-[18px]">
                        {groupNames}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {group.isEnabled && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <TaxToggle
                      isEnabled={group.isEnabled}
                      isThisToggling={isThisToggling}
                      disabled={
                        isThisToggling || (togglingTax && !isThisToggling)
                      }
                      onClick={() => onToggle(group._id, group.isEnabled, true)}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
