import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import RangeTag from "@/components/ui/RangeTag";

/**
 * One figure tile. Shared so the employee-detail grid, the customer-detail
 * stats and anything else built from a spec list render the identical card —
 * they were each carrying their own copy of these classes.
 */
export type StatSpec = {
  key: string;
  label: string;
  /**
   * ReactNode rather than string so a card can carry a unit inside the figure
   * — "1,240 pts" reads as one value, and a separate line would not.
   */
  value: ReactNode;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  /**
   * Follows the page's date filter, so the card gets a RANGE tag. Omit on
   * pages with no date filter at all — an untagged card on a page that has
   * one means the figure ignores it.
   */
  ranged?: boolean;
};

export const STAT_CARD = "  rounded-xl  p-4 shadow-sm md:p-5";

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  ranged = false,
}: Omit<StatSpec, "key">) {
  return (
    <div
      className={`${STAT_CARD} transition-shadow duration-200 hover:shadow-md`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-gray-500 md:text-[13px]">
          {label}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 ${bgColor}`}
        >
          <Icon size={15} className={iconColor} />
        </div>
      </div>

      {/* Tag rides the value row so it costs no extra height. */}
      <div className="mt-3 flex items-baseline justify-between gap-2 md:mt-4">
        <p className="truncate text-xl font-bold tracking-tight tabular-nums text-gray-900 md:text-[22px]">
          {value}
        </p>
        {ranged && <RangeTag />}
      </div>
    </div>
  );
}

/** Matching placeholder, so the grid does not shift when data lands. */
export function StatCardSkeleton() {
  return (
    <div className={`${STAT_CARD} animate-pulse`}>
      <div className="flex items-center justify-between gap-2">
        <div className="h-3.5 w-20 rounded bg-gray-100" />
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gray-100 md:h-8 md:w-8" />
      </div>
      <div className="mt-3 h-6 w-24 rounded bg-gray-100 md:mt-4" />
    </div>
  );
}
