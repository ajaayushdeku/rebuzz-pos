"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Crown, Gem, Leaf, type LucideIcon } from "lucide-react";

import { PLANS, findPlan, type PlanId } from "@/lib/config/plans";
import { useSidebar } from "@/providers/SidebarProvider";

const PLAN_ICONS: Record<PlanId, LucideIcon> = {
  free: Leaf,
  yearly: Gem,
  lifetime: Crown,
};

async function fetchCurrentPlan(): Promise<PlanId> {
  const res = await fetch("/api/profile");
  if (!res.ok) return "free";

  const payload = await res.json();
  const raw = payload?.data?.user;
  const type = String(raw?.subscriptionType ?? "")
    .trim()
    .toLowerCase();
  const match = PLANS.find(
    (p) => p.id === type || p.name.toLowerCase() === type,
  );
  return match?.id ?? "free";
}

export default function SidebarPlanCard() {
  const { data: currentPlan = "free" } = useQuery({
    queryKey: ["profile-subscription"],
    queryFn: fetchCurrentPlan,
  });
  const { isCollapsed, closeMobile } = useSidebar();

  const plan = findPlan(currentPlan) ?? PLANS[0];
  const Icon = PLAN_ICONS[plan.id] ?? Gem;

  if (isCollapsed) {
    return (
      <Link
        href="/subscriptions"
        title={`Current plan: ${plan.name}`}
        aria-label={`Current plan: ${plan.name}`}
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
              {plan.name}
            </span>
          </span>
        </div>

        {plan.name !== "Lifetime" && (
          <p className="mt-2 text-[11px] font-medium text-blue-600">
            View plans &amp; upgrade
          </p>
        )}
      </Link>
    </div>
  );
}
