"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Plus } from "lucide-react";
import { CreateTaxDialog } from "./CreateTaxRate";
import { useTaxes, useUpdateTaxSettings, useToggleTax } from "@/hooks/useTaxes";
import TaxPickerModal from "./TaxPickerModal";

interface InvoiceTaxCreateProps {
  subtotal: number;
  taxAmount: number;
  finalTotal: number;
  onActiveTaxChange: (taxId: string | null, rate: number) => void;
}

// Reusable toggle button
const Toggle = ({
  checked,
  loading,
  disabled,
  onClick,
}: {
  checked: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {loading ? (
      <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
    ) : (
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-0.5" // ✅ fixed — uses arbitrary value instead of invalid translate-x-4.5
        }`}
      />
    )}
  </button>
);

export default function InvoiceTaxCreate({
  subtotal,
  taxAmount,
  finalTotal,
  onActiveTaxChange,
}: InvoiceTaxCreateProps) {
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const { data, isLoading } = useTaxes();
  const { mutate: updateSettings, isPending: updatingSettings } =
    useUpdateTaxSettings();
  const { mutate: toggleTax, isPending: togglingTax } = useToggleTax();

  const taxes = data?.taxes ?? [];
  const groupedTaxes = data?.groupedTaxes ?? [];
  const taxSettings = data?.taxSettings;

  const [isTaxEnabled, setIsTaxEnabled] = useState(
    taxSettings?.mode === "exclusive",
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Sync with backend state on load
  useEffect(() => {
    setIsTaxEnabled(taxSettings?.mode === "exclusive");
  }, [taxSettings?.mode]);

  // Sync active tax with parent on initial load (normal taxes + grouped taxes)
  useEffect(() => {
    if (taxes.length === 0 && groupedTaxes.length === 0) return;
    if (taxSettings?.mode !== "exclusive") {
      onActiveTaxChange(null, 0);
      return;
    }

    const activeNormal = taxes.find((t) => t.isEnabled);
    if (activeNormal) {
      onActiveTaxChange(activeNormal._id, activeNormal.rate);
      return;
    }

    const activeGroup = groupedTaxes.find((t) => t.isEnabled);
    if (activeGroup) {
      // Compute combined rate for the group
      const rate = activeGroup.taxIds.reduce((sum, id) => {
        const t = taxes.find((x) => x._id === id);
        return sum + (t?.rate ?? 0);
      }, 0);
      onActiveTaxChange(activeGroup._id, rate);
      return;
    }

    onActiveTaxChange(null, 0);
  }, [taxes, groupedTaxes, taxSettings?.mode]);

  const handleEnableSwitch = () => {
    const newMode = isTaxEnabled ? "none" : "exclusive";
    setIsTaxEnabled(!isTaxEnabled); // optimistic

    updateSettings(
      { mode: newMode, isAddonTaxEnabled: false },
      {
        onSuccess: () => {
          if (newMode === "none") {
            onActiveTaxChange(null, 0);
          }
        },
        onError: () => {
          // revert optimistic update on failure
          setIsTaxEnabled(isTaxEnabled);
        },
      },
    );
  };

  const handleToggleTax = (
    taxId: string,
    currentlyEnabled: boolean,
    isGroup = false,
  ) => {
    setTogglingId(taxId);

    // Find any currently active tax (normal or group) that's NOT this one
    const activeNormal = taxes.find((t) => t.isEnabled && t._id !== taxId);
    const activeGroup = groupedTaxes.find(
      (t) => t.isEnabled && t._id !== taxId,
    );
    const currentlyActive = activeNormal || activeGroup;

    const doToggle = () => {
      toggleTax(
        { taxId, isEnabled: !currentlyEnabled },
        {
          onSuccess: () => {
            setTogglingId(null);
            if (!currentlyEnabled) {
              if (isGroup) {
                // Compute combined rate for group
                const group = groupedTaxes.find((g) => g._id === taxId);
                const rate =
                  group?.taxIds.reduce((sum, id) => {
                    const t = taxes.find((x) => x._id === id);
                    return sum + (t?.rate ?? 0);
                  }, 0) ?? 0;
                onActiveTaxChange(taxId, rate);
              } else {
                const tax = taxes.find((t) => t._id === taxId);
                onActiveTaxChange(taxId, tax?.rate ?? 0);
              }
            } else {
              onActiveTaxChange(null, 0);
            }
          },
          onError: () => setTogglingId(null),
        },
      );
    };

    // Disable currently active tax first if enabling a new one
    if (!currentlyEnabled && currentlyActive) {
      toggleTax(
        { taxId: currentlyActive._id, isEnabled: false },
        { onSuccess: doToggle, onError: () => setTogglingId(null) },
      );
    } else {
      doToggle();
    }
  };

  return (
    <div className="border-t bg-gray-50/50 px-4 py-4 space-y-4">
      {/* ── Header: Create button + enable switch ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreateTaxDialog />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Enable Tax
            </span>
            <Toggle
              checked={isTaxEnabled}
              loading={updatingSettings}
              disabled={updatingSettings}
              onClick={handleEnableSwitch}
            />
          </div>

          {/* + button — only shown when tax mode is enabled */}
          {isTaxEnabled && (
            <button
              type="button"
              onClick={() => setTaxModalOpen(true)}
              className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
              title="Select tax"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isTaxEnabled && (
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
            Exclusive tax active
          </span>
        )}
      </div>

      {/* ── Tax list — only when tax mode is enabled ── */}
      {/* {isTaxEnabled && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading taxes...
            </div>
          ) : taxes.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              No taxes yet. Create one using the button above.
            </p>
          ) : (
            taxes.map((tax) => {
              const isThisToggling = togglingId === tax._id;
              return (
                <div
                  key={tax._id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                    tax.isEnabled
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tax.name}
                    </p>
                    <p className="text-xs text-gray-400">{tax.rate}%</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {tax.isEnabled && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <Toggle
                      checked={tax.isEnabled}
                      loading={isThisToggling}
                      disabled={
                        isThisToggling || (togglingTax && !isThisToggling)
                      }
                      onClick={() => handleToggleTax(tax._id, tax.isEnabled)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )} */}

      {/* Active tax summary pill */}
      {isTaxEnabled &&
        (taxes.find((t) => t.isEnabled) ||
          groupedTaxes.find((t) => t.isEnabled)) && (
          <div className="flex items-center gap-2 flex-wrap">
            {taxes
              .filter((t) => t.isEnabled)
              .map((tax) => (
                <div
                  key={tax._id}
                  className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  <span>
                    {tax.name} ({tax.rate}%)
                  </span>
                  <span className="text-blue-400">Active</span>
                </div>
              ))}
            {groupedTaxes
              .filter((t) => t.isEnabled)
              .map((group) => {
                const rate = group.taxIds.reduce((sum, id) => {
                  const t = taxes.find((x) => x._id === id);
                  return sum + (t?.rate ?? 0);
                }, 0);
                return (
                  <div
                    key={group._id}
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    <Layers size={11} />
                    <span>
                      {group.name} ({rate}%)
                    </span>
                    <span className="text-blue-400">Active</span>
                  </div>
                );
              })}
          </div>
        )}

      {/* ── Totals ── */}
      <div className="flex justify-end border-t pt-3">
        <div className="text-right space-y-1.5 min-w-52">
          <div className="flex justify-between gap-12 text-sm text-gray-500">
            <span>After Discount</span>
            <span className="font-medium text-gray-800">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {taxAmount > 0 && (
            <div className="flex justify-between gap-12 text-sm text-blue-600">
              <span>Tax</span>
              <span>+${taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between gap-12 text-lg font-bold text-blue-600 border-t pt-2">
            <span>Grand Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tax picker modal */}
      <TaxPickerModal
        open={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        taxes={taxes}
        groupedTaxes={groupedTaxes}
        isLoading={isLoading}
        togglingId={togglingId}
        togglingTax={togglingTax}
        onToggle={handleToggleTax}
      />
    </div>
  );
}
