"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { PLANS, type Plan, type PlanId } from "@/lib/config/plans";
import PlanTabs from "@/components/subscriptions/PlanTabs";
import PlanCard from "@/components/subscriptions/PlanCard";
import PlanFaq from "@/components/subscriptions/PlanFaq";

/**
 * The plan the business is on today.
 *
 * TODO: read this from the profile — `/api/profile` already returns
 * `subscriptionType`, `isSubscribed` and `subscriptionRemaining`.
 */
const CURRENT_PLAN: PlanId = "free";

export default function SubscriptionPage() {
  // Opening on the popular plan rather than the current one: someone who
  // came here is looking at what they could move to.
  const [selected, setSelected] = useState<PlanId>("yearly");

  const handleChoose = (plan: Plan, withPrinter: boolean) => {
    // TODO: replace with the checkout call once there is an endpoint for it.
    // `withPrinter` is the printer bundle the card's toggle was left on.
    toast(
      `${plan.name}${withPrinter ? " + printer" : ""} — checkout is not available yet.`,
    );
  };

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#e8eaed]">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Subscription
            </h1>
            <p className="mt-0.5 text-xs text-[#9aa0a6]">
              Choose the plan that fits your business needs and budget
            </p>
          </div>
        </div>

        <div className="w-full flex items-center justify-center mb-6">
          {" "}
          <PlanTabs selected={selected} onSelect={setSelected} />
        </div>

        {/* One card per column above `md`; below it, PlanCard hides all but
            the selected one, so this collapses to a single card. */}
        <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={plan.id === selected}
              isCurrent={plan.id === CURRENT_PLAN}
              onChoose={handleChoose}
            />
          ))}
        </div>

        <p className="mt-5 text-[11px] text-[#9aa0a6]">
          Prices are in NPR and include all taxes. Plans renew automatically and
          can be cancelled at any time.
        </p>

        <div className="my-8 border-t border-[#e8eaed]" />

        <PlanFaq />
      </div>
    </div>
  );
}
