import { PLANS } from "@/lib/config/plans";
import PlanCards from "./PlanCards";

// Display approximate USD equivalents on the marketing page only. The plan
// definitions remain in NPR because that is the currency used for billing.
const NPR_PER_USD = 151.55;

function approximateUsd(price: string): string {
  const amount = Number(price.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(amount)) return price;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / NPR_PER_USD);

  return formatted;
}

const USD_PLANS = PLANS.map((plan) => ({
  ...plan,
  price: approximateUsd(plan.price),
  discount: plan.discount
    ? {
        originalPrice: approximateUsd(plan.discount.originalPrice),
        saving: approximateUsd(plan.discount.saving),
      }
    : undefined,
  printerAddon: plan.printerAddon
    ? { ...plan.printerAddon, price: approximateUsd(plan.printerAddon.price) }
    : undefined,
}));

/**
 * * ── Pricing ──
 * The same `PLANS` the subscription page is built from, so a price
 * quoted to a visitor and a price charged to a customer cannot drift
 * apart.
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

        <PlanCards plans={USD_PLANS} />

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-[#9aa6bd]">
          Rounded USD equivalents, converted at NPR 151.55 per USD. Plans are
          billed in NPR. The free plan does not expire and needs no card — you
          can pick a paid plan later, from inside the app.
        </p>
      </div>
    </section>
  );
}
