"use client";

import { useEffect, useState } from "react";
import { Target, Loader2, Save } from "lucide-react";
import ModalShell, {
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { fetchMonthlyOverview, setTargets } from "@/services/apiTarget.client";

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
    <ModalShell
      open={isOpen}
      onClose={onClose}
      busy={saving}
      title="Set monthly targets"
      subtitle={`Enter revenue targets for each month of ${resolvedYear}`}
      icon={Target}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-lg"
      footer={
        <div className="space-y-2.5">
          {/* Total stays in the footer so it is visible while scrolling the
              month list. One line rather than a card — the modal was running
              tall and this block was the cheapest height to give back. */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-4">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-500">
              <Target size={13} className="text-blue-600" />
              Total annual target
            </span>
            <span className="text-[18px] font-bold text-gray-700 tabular-nums">
              {formatCurrencySymbol(
                totalTarget,
                currency.symbol,
                currency.locale,
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={modalGhostButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => save()}
              disabled={saving || isLoading || isError}
              className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save targets
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Loading targets
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-[13px] text-red-500">
          Couldn&apos;t load targets. Please try again.
        </div>
      ) : (
        /* A table rather than stacked cards: the columns now carry headers, and
           dropping the per-row borders and padding takes ~12px off every row. */
        <div className="max-h-[42vh] overflow-y-auto rounded-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400">
                <th className="px-3 py-2 text-left">Month</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Target</th>
                <th className="px-3 py-2 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const targetValue = draft[row.month] ?? 0;
                const variance = getVariance(row.actual, targetValue);
                const isOnTrack =
                  targetValue === 0 || row.actual >= targetValue;

                return (
                  <tr
                    key={row.month}
                    className="border-t border-gray-100 py-2 transition-colors hover:bg-gray-50/70"
                  >
                    <td className="px-3 py-1.5 text-[13px] font-semibold text-gray-900">
                      {MONTHS_SHORT[row.month - 1]}
                    </td>

                    <td className="px-3 py-1.5 text-right text-[12px] font-semibold text-blue-600 tabular-nums">
                      {formatCurrencySymbol(
                        row.actual,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="px-3 py-1.5">
                      <div className="relative ml-auto w-32">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                          {currency.symbol}
                        </span>
                        <input
                          type="number"
                          value={targetValue}
                          onChange={(e) =>
                            handleChange(row.month, e.target.value)
                          }
                          disabled={saving}
                          min={0}
                          step={1000}
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-2 text-right text-[12px] tabular-nums text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
                      </div>
                    </td>

                    <td
                      className={`px-3 py-1.5 text-right text-[11px] font-semibold tabular-nums ${
                        isOnTrack ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      <span className="mr-0.5">{isOnTrack ? "▲" : "▼"}</span>
                      {variance}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModalShell>
  );
}
