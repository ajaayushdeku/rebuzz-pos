"use client";

import Link from "next/link";
import { Crown, Gem, Leaf, type LucideIcon } from "lucide-react";

import { findPlan, resolvePlanId, type PlanId } from "@/lib/config/plans";
import { useSubscriptionType } from "@/hooks/useSubscriptionType";
import { useSidebar } from "@/providers/SidebarProvider";

const PLAN_ICONS: Record<PlanId, LucideIcon> = {
  free: Leaf,
  yearly: Gem,
  lifetime: Crown,
};

export default function SidebarPlanCard() {
  const { subscriptionType, isLoading } = useSubscriptionType();
  const { isCollapsed, closeMobile } = useSidebar();

  const planId = resolvePlanId(subscriptionType);
  const plan = planId ? findPlan(planId) : undefined;

  /**
   * What the card calls the plan.
   *
   * A value the resolver does not recognise is shown as it came rather than
   * flattened to "Free" — the card used to claim the free tier for anything it
   * could not match, which is the one thing it must never tell a paying
   * business. Only a genuinely empty `subscriptionType` reads as Free.
   */
  const name = plan?.name ?? (subscriptionType?.trim() || "Free");
  const Icon = planId ? PLAN_ICONS[planId] : Gem;

  /**
   * Nothing is claimed until the answer is in.
   *
   * The card previously defaulted to "Free" while the request was in flight,
   * so every page load flashed the wrong plan before correcting — which is
   * worse than showing nothing, because a wrong figure shown confidently gets
   * believed.
   */
  if (isLoading) {
    if (isCollapsed) {
      return (
        <div
          aria-hidden
          className="mb-2 mx-auto h-8 w-8 animate-pulse rounded-md bg-gray-100"
        />
      );
    }

    return (
      <div className="px-2 pb-2" aria-hidden>
        <div className="rounded-lg border border-gray-200 bg-white p-2.5">
          <div className="flex animate-pulse items-center gap-2.5">
            <span className="h-8 w-8 shrink-0 rounded-md bg-gray-100" />
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="block h-2 w-16 rounded bg-gray-100" />
              <span className="block h-3 w-20 rounded bg-gray-200" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <Link
        href="/subscriptions"
        title={`Current plan: ${name}`}
        aria-label={`Current plan: ${name}`}
        className="mb-2 mx-auto flex h-8 w-8 items-center justify-center rounded-md text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-600"
      >
        <Icon className="h-4 w-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div className="px-2 pb-2">
      <Link
        href="/subscriptions"
        onClick={closeMobile}
        className="block rounded-lg border border-gray-200 bg-white p-2.5 transition-colors hover:border-blue-300 hover:bg-blue-50/60"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Icon className="h-4 w-4" />
          </span>

          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Current plan
            </span>
            <span className="block truncate text-sm font-semibold text-gray-900">
              {name}
            </span>
          </span>
        </div>

        {/* Only a plan that can still be upgraded says so. */}
        {planId !== "lifetime" && (
          <p className="mt-2 text-[11px] font-medium text-blue-600">
            View plans &amp; upgrade
          </p>
        )}
      </Link>
    </div>
  );
}
