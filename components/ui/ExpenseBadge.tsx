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
/**
 * `badge` is the small uppercase mark most cards use. `pill` is the outlined
 * chip of the refreshed card design, sized to sit beside the range pill (see
 * RangeBadge's `pill`), in the badge's own rose.
 */
const VARIANT = {
  badge:
    "ml-auto gap-1 bg-rose-50/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800",
  pill: "gap-1 border border-rose-200 bg-white px-2 py-0.5 text-[11px] text-rose-800 hover:bg-rose-50/60",
} as const;

export default function ExpenseBadge({
  className = "",
  variant = "badge",
}: {
  className?: string;
  variant?: keyof typeof VARIANT;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard. A native
            `title` shows on hover only, and never for anyone tabbing. */}
        <span
          tabIndex={0}
          className={`inline-flex shrink-0 cursor-help items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${VARIANT[variant]} ${className}`}
        >
          <ReceiptText size={11} />
          {variant === "pill" ? "Uses expenses" : "Expenses"}
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
