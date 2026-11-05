import { HOMEPAGE_PLANS } from "@/lib/config/plans";
import PlanCards from "../PlanCards";

const HOMEPAGE_DISPLAY_PLANS = HOMEPAGE_PLANS.map((plan) => ({
  ...plan,
  price: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.price.currency,
    maximumFractionDigits: 0,
  }).format(plan.price.amount),
}));

/**
 * * ── Pricing ──
 * Homepage pricing uses its own USD list, separate from subscription billing.
 *
 * The cards are a client component: each one opens its own feature
 * list, and nothing in them is buyable. *
 */
export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Pricing
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1b2537] md:text-4xl dark:text-[#e8ecf4]">
            Start free, pay when it pays you back
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Every plan has the whole app in it. What you buy is room to grow —
            more products, and someone to call when you need them.
          </p>
        </div>

        <PlanCards plans={HOMEPAGE_DISPLAY_PLANS} />
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-[#9aa6bd]">
          Prices are shown in USD. The Free plan is available indefinitely; you
          can move to a paid plan as your business grows.
        </p>
      </div>
    </section>
  );
}
