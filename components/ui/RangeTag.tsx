"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Marks a figure as scoped to the page's selected date range.
 *
 * Grids mix range-scoped and all-time values, and nothing on the tile said
 * which was which — so the tag has to sit on the card, not as a caption over
 * the whole grid. Its absence means the figure ignores the date filter.
 */
export default function RangeTag({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* tabIndex so the explanation is reachable by keyboard. A native
            `title` shows on hover only, and never for anyone tabbing. */}
        <span
          tabIndex={0}
          className={cn(
            "shrink-0 cursor-help rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            className,
          )}
        >
          Range
        </span>
      </TooltipTrigger>

      {/* Says what the mark means *and* what its absence means — the second
          half is the useful part on a grid where the two kinds sit together,
          and a one-line title had no room for it. */}
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">Scoped to the date range</p>
        <p className="mt-1 leading-relaxed opacity-80">
          This figure covers the range selected at the top of the page. Figures
          without this tag are all-time, or use their own dates.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
