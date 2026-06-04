"use client";
import { useState } from "react";
import type { TargetActualData } from "./TargetVsActualChart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Set Monthly Targets
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter revenue targets for each month
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Input rows */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-3">
          {draft.map((row) => {
            const variance = getVariance(row.actual, row.target);
            const isOnTrack = row.target === 0 || row.actual >= row.target;
            return (
              <div
                key={row.month}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700 w-10 shrink-0">
                  {row.month}
                </span>

                {/* Actual — read only for reference */}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Actual:</span>
                  <span className="font-medium text-blue-500">
                    {formatCurrency(row.actual, currency)}
                  </span>
                </div>

                {/* Target input */}
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm text-gray-400">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    value={row.target}
                    onChange={(e) => handleChange(row.month, e.target.value)}
                    className="w-36 pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                               text-gray-800 font-medium"
                    min={0}
                    step={1000}
                  />
                </div>

                {/* Variance indicator */}
                <span
                  className={`text-xs font-semibold w-20 text-right shrink-0 ${
                    isOnTrack ? "text-green-500" : "text-red-400"
                  }`}
                >
                  <span className="mr-0.5">{isOnTrack ? "▲" : "▼"}</span>
                  {variance}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total annual target</p>
            <p className="text-sm font-bold text-gray-800">
              {formatCurrency(totalTarget, currency)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium
                         rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white font-medium bg-blue-500
                         hover:bg-blue-600 rounded-xl transition-colors"
            >
              Save Targets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
