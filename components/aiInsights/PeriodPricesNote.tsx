"use client";

import { Info } from "lucide-react";

import {
  PeriodLabelProvider,
  useCurrentPricesNote,
} from "@/components/aiInsights/periodLabel";

/**
 * The one line on the page that says prices are today's.
 *
 * Its own component because the sentence comes from a hook that reads the period
 * context, and the context is provided further down the tree — so this wraps
 * itself in the provider to ask the question. Cheaper than threading the label
 * through, and it keeps one definition of the sentence.
 *
 * Renders nothing outside a period: the menu and the sales are then from the same
 * week, and there is nothing to warn about.
 */
function Note() {
  const note = useCurrentPricesNote();
  if (!note) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-[#e3e3e3] bg-[#f8f9fa] px-4 py-2.5 text-[11px] leading-relaxed text-[#5f6368] dark:border-white/10 dark:bg-white/5 dark:text-[#a9b4c7]">
      <Info
        className="mt-px h-3.5 w-3.5 shrink-0 text-[#9aa0a6] dark:text-[#7b869b]"
        aria-hidden
      />
      <span>{note}</span>
    </p>
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
