"use client";

import { useEffect, useState } from "react";
import { Target, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  fetchMonthlyOverview,
  setTargets,
} from "@/services/apiTarget.client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Year to edit; defaults to the current year. */
  year?: number;
  /** Fired after a successful save (e.g. so the chart can refresh). */
  onSaved?: () => void;
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function SetTargetsModal({
  isOpen,
  onClose,
  year,
  onSaved,
}: Props) {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const resolvedYear = year ?? new Date().getFullYear();

  // Actual + saved-target per month, straight from the API.
  const {
    data: overview,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["target-monthly-overview", resolvedYear],
    queryFn: () => fetchMonthlyOverview(resolvedYear),
    enabled: isOpen,
  });

  // Editable targets keyed by month number (1–12).
  const [draft, setDraft] = useState<Record<number, number>>({});

  // (Re)seed the draft from the API whenever the modal opens or data arrives —
  // this also discards any un-saved edits from a previous open.
  useEffect(() => {
    if (isOpen && overview) {
      const next: Record<number, number> = {};
      for (const m of overview.months) next[m.month] = m.target;
      setDraft(next);
    }
  }, [isOpen, overview]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () =>
      setTargets({
        monthly: {
          year: resolvedYear,
          targets: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            amount: Math.max(0, draft[i + 1] ?? 0),
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Targets saved");
      queryClient.invalidateQueries({ queryKey: ["target"] });
      queryClient.invalidateQueries({ queryKey: ["target-monthly-overview"] });
      queryClient.invalidateQueries({ queryKey: ["target-progress"] });
      onSaved?.();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to save targets",
      );
    },
  });

  if (!isOpen) return null;

  const rows = overview?.months ?? [];
  const totalTarget = rows.reduce((sum, m) => sum + (draft[m.month] ?? 0), 0);

  const handleChange = (month: number, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10);
    setDraft((prev) => ({ ...prev, [month]: isNaN(parsed) ? 0 : parsed }));
  };

  // Variance vs actual, avoiding Infinity% when the target is 0.
  const getVariance = (actual: number, target: number): string => {
    if (target === 0) return actual === 0 ? "0.0" : "100.0";
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
              Enter revenue targets for each month of {resolvedYear}
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
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-gray-800">
              Monthly Revenue Targets
            </h3>
            <p className="text-[11px] text-gray-500">
              Set a target for each month and track progress
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="ml-2 text-sm">Loading targets...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-red-500">
              Couldn&apos;t load targets. Please try again.
            </div>
          ) : (
            <div className="border-t border-gray-200">
              {rows.map((row, index) => {
                const targetValue = draft[row.month] ?? 0;
                const variance = getVariance(row.actual, targetValue);
                const isOnTrack = targetValue === 0 || row.actual >= targetValue;
                return (
                  <div
                    key={row.month}
                    className={`flex items-center justify-between gap-3 px-3 py-3.5 ${
                      index < rows.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-700 w-10 shrink-0">
                      {MONTHS_SHORT[row.month - 1]}
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
                        value={targetValue}
                        onChange={(e) =>
                          handleChange(row.month, e.target.value)
                        }
                        disabled={saving}
                        className="w-32 pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                   text-gray-800 font-medium bg-white disabled:opacity-50"
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
          )}
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
              disabled={saving}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => save()}
              disabled={saving || isLoading || isError}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "Saving..." : "Save Targets"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
