"use client";

import { CalendarRange } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Marks a whole card as following the page's global date range.
 *
 * The Profit & Cost page mixes three kinds of card: some follow the header's
 * range, some carry their own month picker, and some are not wired to a date
 * at all. Without a mark they look identical, so changing the range appears to
 * do nothing to most of the page and the reader is left to guess which numbers
 * moved.
 *
 * The header counterpart to `RangeTag`, which marks a single figure inside a
 * stat tile. Two components on purpose: a tag sits inline beside a number and
 * has to stay out of its way, while this labels an entire card from its header
 * and can afford an icon and a pill.
 *
 * Only put this on a card that genuinely re-fetches on the range — a badge on
 * one that ignores it is worse than none, because it is then believed.
 */
/**
 * The two shapes of date control this codebase puts at the top of a page: a
 * start/end range on the report pages, and a month/year picker on Expense
 * Analytics. The mark is the same either way — the tooltip has to say which
 * control it means, or it sends the reader to a filter that is not there.
 */
const COPY = {
  range: {
    title: "Follows the date range",
    body: "These figures update when you change the range at the top of the page. Cards without this mark use their own dates, or none at all.",
  },
  month: {
    title: "Follows the month filter",
    body: "These figures update when you change the month and year at the top of the page. Cards without this mark use their own window, or none at all.",
  },
} as const;

export default function RangeBadge({
  className = "",
  scope = "range",
}: {
  className?: string;
  scope?: keyof typeof COPY;
}) {
  const copy = COPY[scope];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard. A native
            `title` shows on hover only, and never for anyone tabbing. */}
        <span
          tabIndex={0}
          className={`ml-auto inline-flex shrink-0 cursor-help items-center gap-1 rounded-full bg-gray-50/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
        >
          <CalendarRange size={9} />
          Range
        </span>
      </TooltipTrigger>

      {/* Says what the mark means *and* what its absence means — the second
          half is the useful part, and a one-line title had no room for it. */}
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 leading-relaxed opacity-80">{copy.body}</p>
      </TooltipContent>
    </Tooltip>
  );
}
