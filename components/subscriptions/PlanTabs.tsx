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
      className="relative flex items-center gap-1 rounded-xl bg-[#e4f2fe] p-1"
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
              "min-w-[100px] flex items-center text-center justify-center gap-2 rounded-lg px-5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
              isSelected
                ? "bg-white font-bold text-blue-950 shadow-sm"
                : "font-semibold text-blue-800 hover:text-blue-950",
            )}
          >
            {plan.name}
          </button>
        );
      })}
    </div>
  );
}
