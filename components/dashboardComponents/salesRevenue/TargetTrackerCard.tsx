"use client";

import { useState } from "react";
import { Target, Pencil, Loader2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import {
  fetchTargetProgress,
  setTargets,
  type TargetPeriod,
  type ProgressStatus,
  type SetTargetsPayload,
} from "@/services/apiTarget.client";

const TABS: { label: string; value: TargetPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const PERIOD_LABEL: Record<TargetPeriod, string> = {
  daily: "Daily sales goal (today)",
  weekly: "Weekly sales goal (this week)",
  monthly: "Monthly sales goal (this month)",
};

// Status is authoritative from the backend — never recomputed on the client.
// (This is the fix for the old divide-by-zero bug that showed "Behind",
// "0% achieved" and "surpassed 🎉" all at once when the goal was 0.)
const STATUS_BADGE: Record<
  ProgressStatus,
  { label: string; className: string }
> = {
  no_target: {
    label: "Set a goal",
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
  behind: {
    label: "Behind target",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  on_track: {
    label: "On track",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  surpassed: {
    label: "Surpassed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

const STATUS_BAR: Record<ProgressStatus, string> = {
  no_target: "bg-gray-300",
  behind: "bg-red-400",
  on_track: "bg-blue-500",
  surpassed: "bg-green-500",
};

/** Build the PUT /target body for editing the active period's goal. */
function buildSetPayload(
  period: TargetPeriod,
  amount: number,
): SetTargetsPayload {
  if (period === "daily") return { dailyTarget: amount };
  if (period === "weekly") return { weeklyTarget: amount };
  const now = new Date();
  return {
    monthly: {
      year: now.getFullYear(),
      targets: [{ month: now.getMonth() + 1, amount }],
    },
  };
}

export default function TargetTrackerCard() {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [activePeriod, setActivePeriod] = useState<TargetPeriod>("weekly");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  // ── Progress (single source of truth from the API) ──
  const {
    data: progress,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["target-progress", activePeriod],
    queryFn: () => fetchTargetProgress(activePeriod),
    staleTime: 60 * 1000,
  });

  // ── Saving a new goal (admin only upstream — 403 otherwise) ──
  const { mutate: saveGoal, isPending: saving } = useMutation({
    mutationFn: (amount: number) =>
      setTargets(buildSetPayload(activePeriod, amount)),
    onSuccess: () => {
      toast.success("Target updated");
      setEditing(false);
      // Refresh every period's progress + any saved-target / overview readers.
      queryClient.invalidateQueries({ queryKey: ["target-progress"] });
      queryClient.invalidateQueries({ queryKey: ["target"] });
      queryClient.invalidateQueries({ queryKey: ["target-monthly-overview"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update target",
      );
    },
  });

  const target = progress?.target ?? 0;
  const achieved = progress?.achieved ?? 0;
  const remaining = progress?.remaining ?? 0;
  const status: ProgressStatus = progress?.progressStatus ?? "no_target";
  const hasTarget = status !== "no_target";
  const pct =
    progress?.percentAchieved != null
      ? Math.min(100, Math.round(progress.percentAchieved))
      : 0;

  const badge = STATUS_BADGE[status];

  const startEdit = () => {
    setDraft(target > 0 ? String(target) : "");
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = Math.max(0, Number(draft) || 0);
    saveGoal(parsed);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full relative select-none">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Target size={15} className="text-blue-600" />
        </div>

        <ComponentHeader
          title="Target tracker"
          subHeader="Monitor daily, weekly, and monthly sales progress against goals"
        />
      </div>

      {/* Period tabs */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActivePeriod(tab.value);
              setEditing(false);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === tab.value
                ? " border-[1.5px] border-gray-800 text-gray-900 shadow-sm"
                : "text-gray-700 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goal label + badge */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {PERIOD_LABEL[activePeriod]}
        </p>
        {!isLoading && !isError && (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Actual value */}
      {isLoading ? (
        <div className="h-9 w-32 bg-gray-100 rounded-md animate-pulse mb-4" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
          {fmt(achieved)}
        </p>
      )}

      {isError && (
        <p className="text-[11px] text-red-500 -mt-3 mb-3">
          Couldn&apos;t load target progress. Please try again.
        </p>
      )}

      {/* Progress bar + editable goal */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-1.5">
          <span className="font-medium shrink-0">
            {hasTarget ? `${pct}% achieved` : "No goal set"}
          </span>

          {editing ? (
            /* Edit mode — inline input + icon-only Save/Cancel (no save-on-blur) */
            <span className="flex items-center gap-1.5">
              Goal:
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft}
                  autoFocus
                  disabled={saving}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  placeholder="0"
                  className="w-24 border border-gray-200 rounded-md pl-5 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={commitEdit}
                disabled={saving}
                title="Save target"
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                title="Cancel"
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <X size={13} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              disabled={isLoading || isError}
              title="Click to edit target"
              className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              {hasTarget ? `Goal: ${fmt(target)}` : "Set a goal"}
              <Pencil size={11} className="opacity-50" />
            </button>
          )}
        </div>

        {/* % bar — always shown when a goal exists, including in edit mode */}
        {hasTarget && (
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR[status]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Remaining / progress detail */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-50">
        <span className="text-gray-500">
          {!hasTarget ? (
            <span className="text-gray-400">
              Set a goal to start tracking progress
            </span>
          ) : status === "surpassed" ? (
            <span className="text-green-600 font-semibold">
              Target surpassed 🎉
            </span>
          ) : (
            <>
              <span className="font-semibold text-gray-700">
                {fmt(remaining)}
              </span>{" "}
              remaining to hit target
            </>
          )}
        </span>
        {hasTarget && (
          <span className="text-gray-400 font-medium">
            {fmt(achieved)} of {fmt(target)}
          </span>
        )}
      </div>
    </div>
  );
}
