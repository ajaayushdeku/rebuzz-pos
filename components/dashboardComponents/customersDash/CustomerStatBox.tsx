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
    <div className="rounded-2xl border border-[#e3e3e3] bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-[#5f6368]">{label}</span>
        {/* The square takes the icon's colour, so `border-current/20` frames
            it in the same hue — as the card icons do. */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${bgColor ?? "bg-gray-50"} ${iconColor ?? "text-gray-500"}`}
        >
          <Icon size={15} />
        </div>
      </div>

      {/* Only two of these four figures move with the filter, so the tag
          rides the value row the way it does on the other stat grids. */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        {/* toLocaleString, not String() — a four-figure count rendered as
            "12340" before, with no separator. */}
        <p className="truncate text-xl font-semibold tracking-tight tabular-nums text-[#3c4043] md:text-[22px]">
          {value.toLocaleString()}
        </p>
        {ranged && <RangeTag />}
      </div>
    </div>
  );
}
