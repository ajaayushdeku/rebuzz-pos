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

// Component

export default function SetTargetsModal({
  isOpen,
  onClose,
  data,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<TargetActualData[]>(data);
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

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
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
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-2">
          {draft.map((row) => (
            <div
              key={row.month}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-gray-600 w-10 shrink-0">
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
                className={`text-xs font-semibold w-16 text-right shrink-0 ${
                  row.actual >= row.target ? "text-green-500" : "text-red-400"
                }`}
              >
                {row.actual >= row.target ? "▲" : "▼"}{" "}
                {Math.abs(
                  ((row.actual - row.target) / row.target) * 100,
                ).toFixed(1)}
                %
              </span>
            </div>
          ))}
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
