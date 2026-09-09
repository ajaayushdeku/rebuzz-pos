"use client";

import { ReceiptText } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Marks a card as drawing on the expense tracker.
 *
 * The Profit & Cost page mixes two kinds of number. Some come from the till —
 * sales, cost prices, tax — and are as complete as the trading records. Others
 * depend on what someone typed into the expense tracker, and a month nobody
 * kept up with looks like a month with no costs. The two read identically once
 * they reach a chart, so a figure that quietly rests on bookkeeping is worth
 * marking as such.
 *
 * The counterpart to `RangeBadge`, and sits beside it where a card both
 * follows the date range and reads expenses.
 *
 * Only put this on a card that genuinely reads expense entries — a badge on
 * one that doesn't is worse than none, because it is then believed.
 */
export default function ExpenseBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard. A native
            `title` shows on hover only, and never for anyone tabbing. */}
        <span
          tabIndex={0}
          className={`ml-auto inline-flex shrink-0 cursor-help items-center gap-1 rounded-full bg-rose-50/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
        >
          <ReceiptText size={11} />
          Expenses
        </span>
      </TooltipTrigger>

      {/* Says what the mark means *and* what follows from it — that the figure
          is only as complete as the tracker, which is the part a reader needs
          before trusting a low cost total. */}
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">Uses your expense entries</p>
        <p className="mt-1 leading-relaxed opacity-80">
          These figures include costs recorded in the expense tracker as well
          the miscellenous income, so they are only as complete as what has been
          entered for the period.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
