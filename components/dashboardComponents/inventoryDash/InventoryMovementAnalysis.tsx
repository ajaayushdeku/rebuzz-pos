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
      color: CHART_PALETTE.good,
      badge: marginBadge(fastMargin),
      badgeClass: "border-green-200 font-semibold bg-green-50 text-green-700",
      icon: TrendingUp,
      items: fast,
      note: nameList(fast),
    },
    {
      label: "Normal Velocity",
      color: CHART_PALETTE.blue,
      badge: marginBadge(normalMargin),
      badgeClass: "border-blue-200 font-semibold bg-blue-50 text-blue-700",
      icon: Minus,
      items: normal,
      note: nameList(normal),
    },
    {
      label: "Slow Moving",
      color: CHART_PALETTE.warn,
      badge: marginBadge(slowMargin),
      badgeClass: "border-amber-200 font-semibold bg-amber-50 text-amber-700",
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
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Activity size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No inventory movement analysis data available
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Inventory Movement Analysis data will appear here
          </p>
        </div>
      ) : (
        <div>
          {categories.map(
            ({
              label,
              color,
              badge,
              badgeClass,
              icon: Icon,
              items: group,
              note,
            }) => (
              <div
                key={label}
                className="border-b py-3.5 first:pt-0 last:border-0 last:pb-0"
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Icon size={14} style={{ color }} />
                    <span className="text-[13px] " style={{ color }}>
                      {label}
                    </span>
                    <span
                      className="truncate text-[11px] tabular-nums"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
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
                <p
                  className="ml-5 text-[11px] leading-relaxed"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
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
