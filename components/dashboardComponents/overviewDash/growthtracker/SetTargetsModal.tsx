"use client";
import { useState } from "react";
import { Target } from "lucide-react";
import type { TargetActualData } from "./TargetVsActualChart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency, formatCurrencySymbol } from "@/utils/helper";

// Types

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: TargetActualData[];
  onSave: (updated: TargetActualData[]) => void;
}

const STORAGE_KEY = "growth_targets";

/** Build initial draft by merging server data with localStorage targets */
function buildInitialDraft(data: TargetActualData[]): TargetActualData[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedTargets: Record<string, number> = JSON.parse(saved);
      return data.map((row) => ({
        ...row,
        target: savedTargets[row.month] ?? row.target,
      }));
    }
  } catch {
    // ignore
  }
  return data;
}

// Component

export default function SetTargetsModal({
  isOpen,
  onClose,
  data,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<TargetActualData[]>(() =>
    buildInitialDraft(data),
  );
  const { currency } = useCurrency();

  if (!isOpen) return null;

  const handleChange = (month: string, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10);
    setDraft((prev) =>
      prev.map((row) =>
        row.month === month
          ? {
              ...row,
              target: isNaN(parsed) ? 0 : parsed,
            }
          : row,
      ),
    );
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const totalTarget = draft.reduce((sum, d) => sum + d.target, 0);

  // Compute variance safely - avoid Infinity%
  const getVariance = (actual: number, target: number): string => {
    if (target === 0) {
      if (actual === 0) return "0.0";
      // When target is 0 and actual > 0, show as 100% achieved
      return "100.0";
    }
    return Math.abs(((actual - target) / target) * 100).toFixed(1);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg px-2 py-1 rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-3.5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Set Monthly Targets
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter revenue targets for each month
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable month targets */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-3 scrollbar-hide">
          {/* ── Monthly Targets ──────────────────────────── */}
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-gray-800">
              Monthly Revenue Targets
            </h3>
            <p className="text-[11px] text-gray-500">
              Set a target for each month and track progress
            </p>
          </div>

          <div className="border-t border-gray-200">
            {draft.map((row, index) => {
              const variance = getVariance(row.actual, row.target);
              const isOnTrack = row.target === 0 || row.actual >= row.target;
              return (
                <div
                  key={row.month}
                  className={`flex items-center justify-between gap-3 px-3 py-3.5 ${
                    index < draft.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className="text-xs font-semibold text-gray-700 w-10 shrink-0">
                    {row.month}
                  </span>

                  {/* Actual — read only for reference */}
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <span>Actual:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrencySymbol(
                        row.actual,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>

                  {/* Target input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[11px] text-gray-400">
                      {currency.symbol}{" "}
                    </span>
                    <input
                      type="number"
                      value={row.target}
                      onChange={(e) => handleChange(row.month, e.target.value)}
                      className="w-32 pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                 text-gray-800 font-medium bg-white"
                      min={0}
                      step={1000}
                    />
                  </div>

                  {/* Variance indicator */}
                  <span
                    className={`text-[11px] font-semibold w-16 text-right shrink-0 ${
                      isOnTrack ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    <span className="mr-0.5">{isOnTrack ? "▲" : "▼"}</span>
                    {variance}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed total annual target */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shadow-sm shrink-0">
                <Target size={16} />
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Total annual target</p>
                <p className="text-sm font-bold text-gray-800">
                  {formatCurrencySymbol(
                    totalTarget,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
            >
              Save Targets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
