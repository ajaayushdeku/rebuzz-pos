"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Crown,
  Gem,
  Leaf,
  Printer,
  type LucideIcon,
} from "lucide-react";

import { parseSubscription, planTone, type PlanTier } from "@/lib/config/plans";
import { useSubscriptionType } from "@/hooks/useSubscriptionType";
import { useSidebar } from "@/providers/SidebarProvider";

const TIER_ICONS: Record<PlanTier, LucideIcon> = {
  free: Leaf,
  standard: Gem,
  lifetime: Crown,
};

export default function SidebarPlanCard() {
  const { subscriptionType, isLoading } = useSubscriptionType();
  const { isCollapsed, closeMobile } = useSidebar();

  const { tier, hasPrinter, label, raw } = parseSubscription(subscriptionType);

  /**
   * What the card calls the plan.
   *
   * `label` spells out the tier and its billing period — "Standard ·
   * Semi-annual" — because on this card the period is the useful half: it is
   * what says when the next bill lands.
   *
   * A tier the parser does not recognise is shown as it came rather than
   * flattened to "Free", which is the one thing this card must never tell a
   * paying business.
   */
  const name = tier ? label : raw || "Free";
  const Icon = tier ? TIER_ICONS[tier] : Gem;

  // Same colour the navbar badge gives this plan.
  const tone = planTone(subscriptionType);

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
        className={`mb-2 mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors ${tone.icon}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
      </Link>
    );
  }

  /**
   * A lifetime plan has nothing to upgrade to, so the card offers to show the
   * plan rather than to change it — the destination is the same page either
   * way, but the promise it makes is not.
   */
  const isLifetime = tier === "lifetime";
  const action = isLifetime ? "View plan details" : "View plans & upgrade";
  const ActionIcon = isLifetime ? ChevronRight : ArrowUpRight;

  return (
    <Link
      href="/subscriptions"
      onClick={closeMobile}
      title={`Current plan: ${name}. ${action}`}
      className="group flex items-center gap-3 whitespace-nowrap border-t border-gray-200 bg-white px-3 py-2.5 transition-colors hover:bg-blue-50/60"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone.tile}`}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Current plan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-gray-900">
            {name}
          </span>
          {/* The printer bundle rides on top of a tier rather than being one,
              so it gets a mark of its own instead of lengthening the name. */}
          {hasPrinter && (
            <span
              title="Includes the printer bundle"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500"
            >
              <Printer size={10} />
            </span>
          )}
        </span>
      </span>

      {/* The third line of text this replaces said what the card already is —
          a link to the plans page. As an icon it keeps the affordance and
          gives the plan name the whole width. A span, not a button: a button
          inside an anchor is invalid, and the whole row is already the link.
          Its wording survives in `title` and `aria-label` above. */}
      <span
        aria-hidden
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
          isLifetime
            ? "text-amber-600 group-hover:bg-amber-50"
            : "text-blue-600 group-hover:bg-blue-100"
        }`}
      >
        <ActionIcon size={16} />
      </span>
    </Link>
  );
}
