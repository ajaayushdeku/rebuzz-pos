"use client";

import { cn } from "@/lib/utils";
import { PLANS, type PlanId } from "@/lib/config/plans";

/**
 * The plan switcher.
 *
 * It does two jobs at once, which is why it is always on screen rather than
 * being hidden above `md`: on a narrow screen it chooses which single card is
 * shown, and on a wide screen — where all three are already visible — it marks
 * which one is highlighted. Same control, same state, so a choice made at one
 * width survives a resize.
 */
export default function PlanTabs({
  selected,
  onSelect,
}: {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Subscription plans"
      className="inline-flex w-full rounded-xl border border-gray-200 bg-gray-50 p-1 sm:w-auto"
    >
      {PLANS.map((plan) => {
        const isSelected = plan.id === selected;
        return (
          <button
            key={plan.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(plan.id)}
            className={cn(
              "flex-1 cursor-pointer rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors sm:flex-none sm:min-w-28",
              isSelected
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {plan.name}
          </button>
        );
      })}
    </div>
  );
}
