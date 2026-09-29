import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { MergedSalesItem } from "@/services/apiInventory";
import {
  classifySalesVelocity,
  itemsWithCost,
  marginOverCost,
  unitShare,
} from "@/lib/salesVelocity";
import { CHART_PALETTE, ChartCard } from "../chartCard";

/** Names are truncated so one long list can't push the card out of shape. */
const MAX_NAMES = 6;

const nameList = (items: MergedSalesItem[]): string => {
  if (items.length === 0) return "—";
  const shown = items.slice(0, MAX_NAMES).map((i) => i.name);
  const rest = items.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest} more` : shown.join(", ");
};

const InventoryMovementAnalysis = ({ items }: { items: MergedSalesItem[] }) => {
  const { fast, normal, slow, totalUnits } = classifySalesVelocity(items);

  // Margin over cost, not a period-on-period trend — the API gives one
  // snapshot per range, so there's no earlier period to compare against.
  const fastMargin = marginOverCost(fast);
  const normalMargin = marginOverCost(normal);
  const slowMargin = marginOverCost(slow);

  const marginBadge = (margin: number | null) =>
    margin === null ? "—" : `${margin > 0 ? "+" : ""} ${margin}% margin`;

  const categories = [
    {
      label: "Fast Moving",
      colorClass: "text-[#1e8e3e] dark:text-[#10b981]",
      badge: marginBadge(fastMargin),
      badgeClass:
        "border-green-200 font-semibold bg-green-50 text-green-700 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300",
      icon: TrendingUp,
      items: fast,
      note: nameList(fast),
    },
    {
      label: "Normal Velocity",
      colorClass: "text-[#1a73e8] dark:text-[#7ba2e3]",
      badge: marginBadge(normalMargin),
      badgeClass:
        "border-blue-200 font-semibold bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:border-blue-400/25 dark:text-[#a8c4ee]",
      icon: Minus,
      items: normal,
      note: nameList(normal),
    },
    {
      label: "Slow Moving",
      colorClass: "text-[#e37400] dark:text-amber-400",
      badge: marginBadge(slowMargin),
      badgeClass:
        "border-amber-200 font-semibold bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300",
      icon: TrendingDown,
      items: slow,
      note:
        slow.length > 0
          ? `${nameList(slow)} (low velocity)`
          : "None identified",
    },
  ];

  return (
    <ChartCard
      icon={Activity}
      title="Inventory Movement Analysis"
      info={{
        heading: "Reading this card",
        // From classifySalesVelocity and marginOverCost.
        body: "Products split into three bands by how fast they sell compared with the rest of your range, with the share of units each band accounts for. The badge is profit margin over cost for that band — not a change over time — and it only counts products that have a cost price recorded, so it reads “—” when none do.",
      }}
      subtitle="Fast-moving vs slow-moving categorization"
      className="flex-1"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <Activity
              size={24}
              className="text-[#9aa0a6] dark:text-[#9aa6bd]"
            />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No inventory movement analysis data available
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            Inventory Movement Analysis data will appear here
          </p>
        </div>
      ) : (
        <div>
          {categories.map(
            ({
              label,
              colorClass,
              badge,
              badgeClass,
              icon: Icon,
              items: group,
              note,
            }) => (
              <div
                key={label}
                className="border-b py-3.5 first:pt-0 last:border-0 last:pb-0 border-[#e8eaed] dark:border-white/10"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Icon size={14} className={colorClass} />
                    <span className={`text-[13px] ${colorClass}`}>{label}</span>
                    <span className="truncate text-[11px] tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                      {group.length} {group.length === 1 ? "item" : "items"} ·{" "}
                      {unitShare(group, totalUnits)}% of units
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] tabular-nums ${badgeClass}`}
                    title={
                      itemsWithCost(group) > 0
                        ? `Profit margin over cost, based on ${itemsWithCost(group)} of ${group.length} items with a recorded cost price`
                        : "No cost price recorded for these items"
                    }
                  >
                    {badge}
                  </span>
                </div>
                <p className="ml-5 text-[11px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {note}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </ChartCard>
  );
};

export default InventoryMovementAnalysis;
