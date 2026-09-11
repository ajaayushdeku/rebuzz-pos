import type { LucideIcon } from "lucide-react";

import RangeTag from "@/components/ui/RangeTag";

export interface StatBoxProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  /** Follows the page's date range, so the tile gets a RANGE tag. */
  ranged?: boolean;
}

/**
 * Compact figure tile for the customers dashboard. Shape and spacing follow
 * OverviewStatBox so the two grids read as one family; this one carries no
 * period comparison, so it stops at the value.
 *
 * No `format` prop: the old one was declared but never read, and nothing in
 * CUSTOMER_STAT_CONFIG set it. Implementing it would mean pulling in
 * useCurrency, which would make this a client component — and `icon` is passed
 * from a server component, so it cannot cross that boundary.
 */
export default function CustomerStatBox({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  ranged = false,
}: StatBoxProps) {
  return (
    <div className=" rounded-xl  p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-gray-500 md:text-[13px]">
          {label}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-8 md:w-8 ${bgColor ?? "bg-gray-50"}`}
        >
          <Icon size={15} className={iconColor ?? "text-gray-500"} />
        </div>
      </div>

      {/* Only two of these four figures move with the filter, so the tag
          rides the value row the way it does on the other stat grids. */}
      <div className="mt-3 flex items-baseline justify-between gap-2 md:mt-4">
        {/* toLocaleString, not String() — a four-figure count rendered as
            "12340" before, with no separator. */}
        <p className="truncate text-xl font-bold tracking-tight tabular-nums text-gray-900 md:text-[22px]">
          {value.toLocaleString()}
        </p>
        {ranged && <RangeTag />}
      </div>
    </div>
  );
}
