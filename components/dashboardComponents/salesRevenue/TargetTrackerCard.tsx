"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Target, Pencil } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  getStoredTargets,
  saveStoredTargets,
  DEFAULT_TARGETS,
  type AnalyticsTargets,
} from "@/lib/indexeddb/analyticsPreferences";
import { ComponentHeader } from "@/components/ComponentHeader";

type TargetPeriod = "daily" | "weekly" | "monthly";

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

// Which stored target field backs each period tab.
const TARGET_FIELD: Record<TargetPeriod, keyof AnalyticsTargets> = {
  daily: "dailyTarget",
  weekly: "weeklyTarget",
  monthly: "monthlyTarget",
};

function getStatusBadge(pct: number): { label: string; className: string } {
  if (pct >= 100)
    return {
      label: "Goal reached",
      className: "bg-green-50 text-green-700 border-green-200",
    };
  if (pct >= 85)
    return {
      label: "Close to goal",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  if (pct >= 60)
    return {
      label: "On track",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  return {
    label: "Behind target",
    className: "bg-red-50 text-red-600 border-red-200",
  };
}

function getBarColor(pct: number): string {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 85) return "bg-amber-400";
  if (pct >= 60) return "bg-blue-500";
  return "bg-red-400";
}

/** Local YYYY-MM-DD (no UTC shift). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Date ranges for the current calendar period — independent of the dashboard's
// global date filter.
//  • Daily   → today → today
//  • Weekly  → current calendar week (Sunday, the project convention) → today
//  • Monthly → 1st of the month → today (month-to-date)
//
// Weekly and monthly end at today rather than the end of the period: the report
// API returns no data when endDate is in the future, and revenue can only
// accrue up to today anyway.
function computeRanges(): Record<
  TargetPeriod,
  { startDate: string; endDate: string }
> {
  const now = new Date();
  const today = toLocalDateStr(now);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday of the current week

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    daily: { startDate: today, endDate: today },
    weekly: { startDate: toLocalDateStr(weekStart), endDate: today },
    monthly: { startDate: toLocalDateStr(monthStart), endDate: today },
  };
}

export default function TargetTrackerCard() {
  const { currency } = useCurrency();
  const [activePeriod, setActivePeriod] = useState<TargetPeriod>("weekly");

  // ── Targets (IndexedDB-backed local preferences) ──
  const [targets, setTargets] = useState<AnalyticsTargets>(DEFAULT_TARGETS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Load saved targets once on mount.
  useEffect(() => {
    let cancelled = false;
    getStoredTargets().then((stored) => {
      if (!cancelled) setTargets(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Revenue (current calendar period) ──
  // Ranges are fixed to the current period at mount, so switching tabs never
  // recomputes them and never pulls in the dashboard's global date filter.
  const ranges = useMemo(() => computeRanges(), []);

  // Cache revenue per date-range so re-selecting a tab doesn't refetch.
  const revenueCache = useRef<Record<string, number>>({});
  const [revenue, setRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const { startDate, endDate } = ranges[activePeriod];
    const key = `${startDate}_${endDate}`;

    // Serve from cache when possible — only fetch the selected period.
    if (revenueCache.current[key] !== undefined) {
      setRevenue(revenueCache.current[key]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setRevenue(null);

    fetch(`/api/report?startDate=${startDate}&endDate=${endDate}&limit=25`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const rev = Number(json?.data?.report?.totalRevenue ?? 0);
        revenueCache.current[key] = rev;
        if (!cancelled) setRevenue(rev);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePeriod, ranges]);

  // ── Derived progress ──
  const goal = targets[TARGET_FIELD[activePeriod]];
  const actual = revenue ?? 0;

  const { pct, remaining } = useMemo(() => {
    const p = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0;
    return { pct: p, remaining: Math.max(0, goal - actual) };
  }, [goal, actual]);

  const badge = getStatusBadge(pct);
  const barColor = getBarColor(pct);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  // ── Target editing ──
  const startEdit = () => {
    setDraft(String(goal));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = Math.max(0, Number(draft) || 0);
    const next: AnalyticsTargets = {
      ...targets,
      [TARGET_FIELD[activePeriod]]: parsed,
    };
    setTargets(next);
    setEditing(false);
    void saveStoredTargets(next);
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
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Actual value */}
      {loading ? (
        <div className="h-9 w-32 bg-gray-100 rounded-md animate-pulse mb-4" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
          {fmt(actual)}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-500 -mt-3 mb-3">
          Couldn&apos;t load revenue — showing your saved target.
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-medium">{pct}% achieved</span>

          {/* Editable goal */}
          {editing ? (
            <span className="flex items-center gap-1">
              Goal:
              <input
                type="number"
                min={0}
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-24 border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              title="Click to edit target"
              className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              Goal: {fmt(goal)}
              <Pencil size={11} className="opacity-50" />
            </button>
          )}
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Remaining / progress detail */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-50">
        <span className="text-gray-500">
          {remaining > 0 ? (
            <>
              <span className="font-semibold text-gray-700">
                {fmt(remaining)}
              </span>{" "}
              remaining to hit target
            </>
          ) : (
            <span className="text-green-600 font-semibold">
              Target surpassed 🎉
            </span>
          )}
        </span>
        <span className="text-gray-400 font-medium">
          {fmt(actual)} of {fmt(goal)}
        </span>
      </div>
    </div>
  );
}
