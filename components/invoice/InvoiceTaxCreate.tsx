"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Tags, BadgePercent } from "lucide-react";
import { CreateTaxDialog } from "./CreateTaxRate";
import { useTaxes, useUpdateTaxSettings, useToggleTax } from "@/hooks/useTaxes";
import TaxPickerModal from "./TaxPickerModal";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

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
  const { currency } = useCurrency();
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

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

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

  const activeNormalTaxes = taxes.filter((t) => t.isEnabled);
  const activeGroupTaxes = groupedTaxes.filter((t) => t.isEnabled);
  const hasActiveTax =
    activeNormalTaxes.length > 0 || activeGroupTaxes.length > 0;

  return (
    // `border-t` stays — it's the divider between Discount and Tax inside the
    // left column, which the reference also shows.
    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Tax
      </p>

      {/* ── Controls: create + enable switch + picker ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 h-8 rounded-lg border border-gray-200 px-3">
          <span className="text-xs font-medium text-gray-600">Enable Tax</span>
          <Toggle
            checked={isTaxEnabled}
            loading={updatingSettings}
            disabled={updatingSettings}
            onClick={handleEnableSwitch}
          />
        </div>

        {/* Picker — only when tax mode is enabled */}
        {isTaxEnabled && (
          <button
            type="button"
            onClick={() => setTaxModalOpen(true)}
            className="h-8 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Select tax"
          >
            <Tags className="w-3.5 h-3.5" />
            {hasActiveTax ? "Change tax" : "Select a tax"}
          </button>
        )}

        {/* Create Tax — only when tax mode is enabled */}
        {/* {isTaxEnabled && <CreateTaxDialog />} */}

        {isTaxEnabled && !hasActiveTax && (
          <span className="text-xs text-gray-400">No tax applied</span>
        )}
      </div>

      {/* Active tax summary pills */}
      {isTaxEnabled && hasActiveTax && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeNormalTaxes.map((tax) => (
            <div
              key={tax._id}
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full"
            >
              <span className="tabular-nums  text-[11px] font-semibold  tracking-wider">
                {tax.name} ({tax.rate}%)
              </span>
              <span className="text-blue-400 text-[11px] font-semibold  tracking-wider">
                Active
              </span>
            </div>
          ))}
          {activeGroupTaxes.map((group) => {
            const rate = group.taxIds.reduce((sum, id) => {
              const t = taxes.find((x) => x._id === id);
              return sum + (t?.rate ?? 0);
            }, 0);
            return (
              <div
                key={group._id}
                className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full"
              >
                <Layers size={11} />
                <span className="tabular-nums  text-[11px] font-semibold  tracking-wider">
                  {group.name} ({rate}%)
                </span>
                <span className="text-blue-400 text-[11px] font-semibold  tracking-wider">
                  Active
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Totals ── */}
      <div className="flex justify-end border-t border-gray-100 pt-3">
        <div className="text-right space-y-1.5 min-w-52">
          <div className="flex justify-between gap-12 text-sm text-gray-500">
            <span className="text-[13px] font-semibold  tracking-wider">
              After Discount
            </span>
            <span className="font-medium text-gray-800 tabular-nums text-[13px] font-semibold  tracking-wider">
              {fmt(subtotal)}
            </span>
          </div>

          {taxAmount > 0 && (
            <div className="flex justify-between gap-12 text-sm text-red-600">
              <span className="text-[13px] font-semibold  tracking-wider">
                Tax
              </span>
              <span className="tabular-nums text-[13px] font-semibold  tracking-wider">
                + {fmt(taxAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-12 text-sm font-bold text-blue-600 border-t border-gray-100 pt-2">
            <span className="text-[13px] font-semibold  tracking-wider">
              Grand Total
            </span>
            <span className="tabular-nums text-[13px] font-semibold  tracking-wider">
              {fmt(finalTotal)}
            </span>
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
