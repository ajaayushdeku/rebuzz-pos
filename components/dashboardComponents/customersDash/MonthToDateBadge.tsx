"use client";

import { CalendarRange } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { monthToDate } from "./monthToDate";

/**
 * The exact dates a card covers, when those dates are fixed rather than chosen.
 *
 * Deliberately NOT `RangeBadge`: that one means "this card follows the date
 * range at the top of the page", and its own note warns that putting it on a
 * card which ignores the filter is worse than no badge, because it is then
 * believed. The customer leaderboard has no filter — it is always the current
 * calendar month — so this says what the window IS instead of which control
 * changes it.
 */
export default function MonthToDateBadge({
  className = "",
}: {
  className?: string;
}) {
  const { label, longLabel, isFirstOfMonth } = monthToDate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard; a native
            `title` shows on hover only, and never for anyone tabbing. */}
        <span
          tabIndex={0}
          aria-label={`Covering ${longLabel}`}
          className={`inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-[#dadce0] bg-white ml-2 px-2 py-0.5 text-[11px] tabular-nums text-[#3c4043] outline-none transition-colors hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10 ${className}`}
        >
          <CalendarRange size={11} />
          {label}
        </span>
      </TooltipTrigger>

      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">{longLabel}</p>
        <p className="mt-1 leading-relaxed opacity-80">
          {isFirstOfMonth
            ? "The month has just started, so this covers today only. It is the calendar month so far — not the last 30 days — and it resets on the 1st."
            : "The calendar month so far, from the 1st through today — not the last 30 days. It resets on the 1st of each month and follows no filter."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
