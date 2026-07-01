"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type {
  TargetTrackerData,
  TargetPeriod,
} from "@/lib/mockData/mock-targetperiod-data";

const TABS: { label: string; value: TargetPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

function getStatusBadge(pct: number): {
  label: string;
  className: string;
} {
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

interface TargetTrackerCardProps {
  data: TargetTrackerData;
}

export default function TargetTrackerCard({ data }: TargetTrackerCardProps) {
  const { currency } = useCurrency();
  const [activePeriod, setActivePeriod] = useState<TargetPeriod>("weekly");

  const period = data[activePeriod];
  const pct = Math.min(100, Math.round((period.actual / period.goal) * 100));
  const remaining = Math.max(0, period.goal - period.actual);
  const badge = getStatusBadge(pct);
  const barColor = getBarColor(pct);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full relative select-none">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Target size={15} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Target tracker
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor daily, weekly, and monthly sales progress against goals
          </p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActivePeriod(tab.value)}
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
          {period.label}
        </p>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Actual value */}
      <p className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
        {fmt(period.actual)}
      </p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-medium">{pct}% achieved</span>
          <span>Goal: {fmt(period.goal)}</span>
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
          {fmt(period.actual)} of {fmt(period.goal)}
        </span>
      </div>
    </div>
  );
}
