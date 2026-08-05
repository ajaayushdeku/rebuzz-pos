import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { MergedSalesItem } from "@/services/apiInventory";
import { ComponentHeader } from "@/components/ComponentHeader";
import {
  classifySalesVelocity,
  itemsWithCost,
  marginOverCost,
  unitShare,
} from "@/lib/salesVelocity";

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
    margin === null ? "—" : `${margin > 0 ? "+" : ""}${margin}% margin`;

  const categories = [
    {
      label: "Fast Moving",
      color: "text-green-600",
      badge: marginBadge(fastMargin),
      badgeColor: "bg-green-500 text-white",
      icon: TrendingUp,
      items: fast,
      note: nameList(fast),
    },
    {
      label: "Normal Velocity",
      color: "text-blue-600",
      badge: marginBadge(normalMargin),
      badgeColor: "bg-blue-500 text-white",
      icon: Minus,
      items: normal,
      note: nameList(normal),
    },
    {
      label: "Slow Moving",
      color: "text-amber-600",
      badge: marginBadge(slowMargin),
      badgeColor: "bg-amber-100 text-amber-700 border border-amber-300",
      icon: TrendingDown,
      items: slow,
      note:
        slow.length > 0
          ? `${nameList(slow)} (low velocity)`
          : "None identified",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Activity size={15} className="text-blue-600" />
          </div>
          <ComponentHeader
            title="Inventory Movement Analysis"
            subHeader="Fast-moving vs slow-moving categorization"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Activity size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {" "}
            No inventory movement analysis data available
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Inventory Movement Analysis data will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(
            ({
              label,
              color,
              badge,
              badgeColor,
              icon: Icon,
              items: group,
              note,
            }) => (
              <div
                key={label}
                className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={color} />
                    <span className={`text-sm font-semibold ${color}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {group.length} {group.length === 1 ? "item" : "items"} ·{" "}
                      {unitShare(group, totalUnits)}% of units
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
                    title={
                      itemsWithCost(group) > 0
                        ? `Profit margin over cost, based on ${itemsWithCost(group)} of ${group.length} items with a recorded cost price`
                        : "No cost price recorded for these items"
                    }
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-xs text-gray-400 ml-5 leading-relaxed">
                  {note}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryMovementAnalysis;
