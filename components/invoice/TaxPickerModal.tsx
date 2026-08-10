"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Clear the query each time it opens, so a stale filter doesn't hide
  // everything on the next visit.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  // Escape closes, matching the backdrop click.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 "
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Tax"
        className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800">Select Tax</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a tax to apply to this invoice.
            </p>
          </div>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab === "normal" ? "taxes" : "group taxes"}...`}
              className="w-full h-9 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* List */}
          <div className="min-h-[150px]  max-h-[200px] overflow-y-auto space-y-1.5 -mr-1 pr-1">
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
                        <p className="text-xs text-gray-400 mt-0.5">
                          {tax.rate}%
                        </p>
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
                          onClick={() =>
                            onToggle(tax._id, tax.isEnabled, false)
                          }
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
                          <Layers
                            size={12}
                            className="text-blue-500 shrink-0"
                          />
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
                          onClick={() =>
                            onToggle(group._id, group.isEnabled, true)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <span className="animate-pulse">
            <CreateTaxDialog />
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="w-fit px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all  flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
