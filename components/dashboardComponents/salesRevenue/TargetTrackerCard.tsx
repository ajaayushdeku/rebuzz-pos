"use client";

import { useState } from "react";
import { Target, Pencil, Loader2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  fetchTargetProgress,
  setTargets,
  type TargetPeriod,
  type ProgressStatus,
  type SetTargetsPayload,
} from "@/services/apiTarget.client";
import { CHART_PALETTE, ChartCard, PillSwitch } from "../chartCard";

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

// The bar's fill carries the same meaning as the badge: red behind, blue on
// track, green past the goal.
const STATUS_BAR: Record<ProgressStatus, string> = {
  no_target: "#bdc1c6",
  behind: "#ea4335",
  on_track: CHART_PALETTE.blue,
  surpassed: "#34a853",
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
    <ChartCard
      icon={Target}
      title="Target tracker"
      info={{
        heading: "Reading this card",
        // Worked out by the target controller's progress endpoint.
        body: "The big figure is what your bills have taken so far this day, week or month, set against the goal saved for it. On track means you are at or ahead of where an even pace through the period would put you; behind means you are short of it. Click the goal to change it.",
      }}
      subtitle="Monitor daily, weekly, and monthly sales progress against goals"
      className="h-full select-none"
    >
      {/* Period tabs — full width, as before: everything below follows them */}
      <div className="mb-6">
        <PillSwitch
          label="Target period"
          variant="blue"
          size="full"
          options={TABS}
          value={activePeriod}
          onChange={(period) => {
            setActivePeriod(period);
            setEditing(false);
          }}
        />
      </div>

      {/* Goal label + badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px]" style={{ color: CHART_PALETTE.axis }}>
          {PERIOD_LABEL[activePeriod]}
        </p>
        {!isLoading && !isError && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Actual value */}
      {isLoading ? (
        <div className="mb-4 h-9 w-32 animate-pulse rounded-md bg-[#f1f3f4]" />
      ) : (
        <p
          className="mb-4 text-3xl font-normal tracking-wide"
          style={{ color: CHART_PALETTE.title }}
        >
          {fmt(achieved)}
        </p>
      )}

      {isError && (
        <p className="-mt-3 mb-3 text-[11px] text-red-500">
          Couldn&apos;t load target progress. Please try again.
        </p>
      )}

      {/* Progress bar + editable goal */}
      <div className="mb-3">
        <div
          className="mb-1.5 flex items-center justify-between gap-2 text-xs"
          style={{ color: CHART_PALETTE.axis }}
        >
          <span className="shrink-0 font-medium">
            {hasTarget ? `${pct}% achieved` : "No goal set"}
          </span>

          {editing ? (
            /* Edit mode — inline input + icon-only Save/Cancel (no save-on-blur) */
            <span className="flex items-center gap-1.5">
              Goal:
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
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
                  className="w-24 rounded-md border py-1 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  style={{ borderColor: CHART_PALETTE.control }}
                />
              </div>
              <button
                type="button"
                onClick={commitEdit}
                disabled={saving}
                title="Save target"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: CHART_PALETTE.blue }}
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
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-[#f1f3f4] disabled:opacity-50"
                style={{
                  borderColor: CHART_PALETTE.control,
                  color: CHART_PALETTE.axis,
                }}
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
              className="inline-flex items-center gap-1 tracking-wide transition-colors hover:text-[#3c4043] disabled:opacity-50"
            >
              {hasTarget ? `Goal: ${fmt(target)}` : "Set a goal"}
              <Pencil size={11} className="opacity-50" />
            </button>
          )}
        </div>

        {/* % bar — always shown when a goal exists, including in edit mode */}
        {hasTarget && (
          <div className="h-2 overflow-hidden rounded-full bg-[#e8eaed]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: STATUS_BAR[status] }}
            />
          </div>
        )}
      </div>

      {/* Remaining / progress detail */}
      <div
        className="flex items-center justify-between border-t pt-3 text-xs"
        style={{ borderColor: CHART_PALETTE.grid }}
      >
        <span style={{ color: CHART_PALETTE.axis }}>
          {!hasTarget ? (
            <span style={{ color: CHART_PALETTE.subtitle }}>
              Set a goal to start tracking progress
            </span>
          ) : status === "surpassed" ? (
            <span className="font-semibold text-green-600">
              Target surpassed 🎉
            </span>
          ) : (
            <>
              <span
                className="font-semibold tracking-wide"
                style={{ color: CHART_PALETTE.title }}
              >
                {fmt(remaining)}
              </span>{" "}
              remaining to hit target
            </>
          )}
        </span>
        {hasTarget && (
          <span
            className="font-medium tracking-wide"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {fmt(achieved)} of {fmt(target)}
          </span>
        )}
      </div>
    </ChartCard>
  );
}
