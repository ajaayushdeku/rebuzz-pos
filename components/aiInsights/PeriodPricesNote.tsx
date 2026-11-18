"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

import {
  PeriodLabelProvider,
  useCurrentPricesNote,
} from "@/components/aiInsights/periodLabel";

function Note() {
  const note = useCurrentPricesNote();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!note) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white shadow-sm shadow-blue-500/[0.025] dark:border-blue-400/15 dark:from-blue-400/[0.08] dark:via-indigo-400/[0.055] dark:to-[#111827]">
      {/* Accent */}
      <div className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-400 dark:from-blue-400/70 dark:to-indigo-400/60" />

      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-blue-100/30 dark:hover:bg-blue-400/[0.04] sm:px-4"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-blue-600 dark:text-blue-300">
          <Info className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold tracking-[0.025em] text-blue-800 dark:text-blue-300">
            Pricing context
          </p>
          <p className="text-[10px] text-blue-700/70 dark:text-blue-300/60">
            How pricing insights are interpreted
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-blue-600/70 transition-transform duration-300 dark:text-blue-300/70 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-blue-200/50 px-3.5 py-3 dark:border-blue-400/10 sm:px-4">
            <p className="pl-8 text-[11px] leading-[1.7] text-slate-600 dark:text-slate-300 sm:text-xs">
              {note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PeriodPricesNote({
  period,
}: {
  period?: { label: string } | null;
}) {
  return (
    <PeriodLabelProvider value={period ? { label: period.label } : null}>
      <Note />
    </PeriodLabelProvider>
  );
}
