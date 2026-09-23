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

export const STAT_CARD =
  "rounded-2xl border border-[#e3e3e3] bg-white px-5 py-4";

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  ranged = false,
}: Omit<StatSpec, "key">) {
  return (
    <div className={STAT_CARD}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-[#5f6368]">{label}</span>
        {/* The square takes the icon's colour, so `border-current/20` frames
            it in the same hue — as the card icons do. */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${bgColor} ${iconColor}`}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Tag rides the value row so it costs no extra height. */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="truncate text-xl font-semibold tracking-tight tabular-nums text-[#3c4043] md:text-[22px]">
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
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-3 h-6 w-24 rounded bg-gray-100" />
    </div>
  );
}
