import type { LucideIcon } from "lucide-react";

export interface StatBoxProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
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
}: StatBoxProps) {
  return (
    <div className="bg-surface-card border-surface-border rounded-xl border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-5">
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

      {/* toLocaleString, not String() — a four-figure count rendered as
          "12340" before, with no separator. */}
      <p className="mt-3 truncate text-xl font-bold tracking-tight tabular-nums text-gray-900 md:mt-4 md:text-[22px]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
