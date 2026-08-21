import { cn } from "@/lib/utils";

/**
 * Marks a figure as scoped to the page's selected date range.
 *
 * Grids mix range-scoped and all-time values, and nothing on the tile said
 * which was which — so the tag has to sit on the card, not as a caption over
 * the whole grid. Its absence means the figure ignores the date filter.
 */
export default function RangeTag({ className }: { className?: string }) {
  return (
    <span
      title="Scoped to the selected date range"
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-800",
        className,
      )}
    >
      Range
    </span>
  );
}
