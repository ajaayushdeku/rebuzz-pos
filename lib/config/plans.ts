/**
 * The plans offered on the subscription page.
 *
 * Prices are held as written strings rather than numbers: a subscription is
 * billed in one fixed currency, so running it through the currency context
 * would convert a price that never actually changes.
 *
 * TODO: the figures and feature lists below are placeholders — replace them
 * with the real ones before this page goes in front of a customer.
 */

export type PlanId = "free" | "yearly" | "lifetime";

/**
 * A price cut on a plan.
 *
 * Both halves are written out rather than derived: the saving is what the
 * customer is being told they save, and working it out from two formatted
 * strings would mean parsing money back out of them.
 *
 * Leave it off a plan that is not discounted — the card then shows the
 * price on its own, with no struck-through figure and no badge.
 */
export interface PlanDiscount {
  originalPrice: string;
  saving: string;
}

/**
 * The printer bundle, sold alongside a plan rather than folded into it.
 *
 * Only the paid plans carry one; a card without it shows no toggle at all.
 */
export interface PrinterAddon {
  price: string;
  note: string;
}

/** Appended to a plan's feature list while its printer toggle is on. */
export const PRINTER_FEATURE =
  "High Quality Thermal Receipt Printer with Service & Support";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  cta: string;
  discount?: PlanDiscount;
  printerAddon?: PrinterAddon;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Enough to run a single counter",
    price: "Rs 0",
    period: "forever",
    features: [
      "Limited to 20 products",
      "Sales Processing with Multiple Payment Options",
      "Advanced Inventory Management",
      "Unlimilted Sales Reporting and Analytics",
      "Loyalty Program Management",
      "Unlimited Cloud-Based Data Storage",
      "Appointment Scheduling",
      "Unlimited Employee Accounts",
      "Dynamics QR Payment",
      "Tax Management",
    ],
    cta: "Current plan",
  },
  {
    id: "yearly",
    name: "Yearly",
    tagline: "For a growing shop that needs the full picture",
    price: "Rs 19999",
    discount: { originalPrice: "Rs 24000", saving: "Rs 4001" },
    period: "per year",

    features: [
      "Unlimited Products",
      "Sales Processing with Multiple Payment Options",
      "Advanced Inventory Management",
      "Unlimited Customer Database",
      "Unlimilted Sales Reporting and Analytics",
      "Loyalty Program Management",
      "Unlimited Cloud-Based Data Storage",
      "Appointment Scheduling",
      "Unlimited Employee Accounts",
      "Dynamics QR Payment",
      "Priority Support",
      "Tax Management",
    ],
    cta: "Choose Yearly Plan",
    printerAddon: { price: "Rs 12000", note: "for 12 months" },
  },
  {
    id: "lifetime",
    name: "Lifetime",
    tagline: "Pay once, and never think about it again",
    price: "Rs 80000",
    period: "one time",
    badge: "Best Value",
    features: [
      "Unlimited Products",
      "Sales Processing with Multiple Payment Options",
      "Advanced Inventory Management",
      "Unlimited Customer Database",
      "Unlimilted Sales Reporting and Analytics",
      "Loyalty Program Management",
      "Unlimited Cloud-Based Data Storage",
      "Appointment Scheduling",
      "Unlimited Employee Accounts",
      "Dynamics QR Payment",
      "Priority Support",
      "Tax Management",
    ],
    cta: "Choose Lifetime Plan",
    printerAddon: { price: "Rs 24000", note: "one-time payment" },
  },
];

/**
 * What the navbar badge shows for a subscription.
 *
 * The API's `subscriptionType` is a free-form string and this app does not own
 * it, so the match is deliberately loose: "annual", "yearly" and "1_YEAR" all
 * mean the same plan, and a value nobody anticipated is shown as-is rather
 * than being flattened to "Free" — a business paying for something should
 * never see a badge saying otherwise.
 */
/**
 * What the backend records against an account, as its own vocabulary.
 *
 * Deliberately separate from `PlanId`, which is what the pricing page *sells*.
 * The API has eleven states — three tiers, four billing periods and a printer
 * bundle — and squeezing those into the three offered plans is what made
 * "Standard-monthly" read as no plan at all.
 *
 *   Free
 *   Standard-monthly | -quarterly | -semi-annual | -annual
 *   Lifetime
 *   …and a `-printer` variant of every paid one.
 */
export type PlanTier = "free" | "standard" | "lifetime";
export type BillingPeriod = "monthly" | "quarterly" | "semi-annual" | "annual";

export interface SubscriptionInfo {
  /** Null when the value is one this app does not recognise. */
  tier: PlanTier | null;
  /** Only ever set on the standard tier. */
  period: BillingPeriod | null;
  /** The `-printer` bundle. */
  hasPrinter: boolean;
  /** Ready to print: "Free", "Standard · Semi-annual", "Lifetime". */
  label: string;
  /** Exactly what the API said, for anything unrecognised. */
  raw: string;
}

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "semi-annual": "Semi-annual",
  annual: "Annual",
};

/**
 * Order matters: "Standard-semi-annual" contains "annual", so the longer
 * pattern has to be tried first or every semi-annual account reads as annual —
 * a different plan at a different price.
 */
const PERIOD_PATTERNS: [BillingPeriod, RegExp][] = [
  ["semi-annual", /semi[-_\s]?annual|half[-_\s]?year/],
  ["annual", /annual|year/],
  ["quarterly", /quarter/],
  ["monthly", /month/],
];

/**
 * Read an API `subscriptionType`.
 *
 * The matching is loose because this app does not own the value — it is a
 * string the backend may extend. An unrecognised tier comes back as null with
 * `raw` intact, so callers can show what was actually recorded rather than
 * telling a paying business it is on the free plan.
 */
export function parseSubscription(
  subscriptionType?: string | null,
): SubscriptionInfo {
  const raw = (subscriptionType ?? "").trim();
  const lower = raw.toLowerCase();

  const hasPrinter = /printer/.test(lower);

  let tier: PlanTier | null = null;
  if (/life|perm/.test(lower)) tier = "lifetime";
  else if (/standard|premium|\bpro\b/.test(lower)) tier = "standard";
  else if (!raw || /free|starter|basic/.test(lower)) tier = "free";

  let period: BillingPeriod | null = null;
  if (tier === "standard") {
    period = PERIOD_PATTERNS.find(([, re]) => re.test(lower))?.[0] ?? null;
  }

  let label: string;
  if (tier === "free") label = "Free";
  else if (tier === "lifetime") label = "Lifetime";
  else if (tier === "standard") {
    label = period ? `Standard \u00b7 ${PERIOD_LABELS[period]}` : "Standard";
  } else label = raw;

  return { tier, period, hasPrinter, label, raw };
}

/**
 * The colour family for a tier.
 *
 * Shared by the navbar badge and the sidebar card so the two cannot disagree
 * about what a tier looks like. The printer bundle does not change the colour —
 * it is an add-on to a tier, not a tier of its own.
 */
export function planTone(subscriptionType?: string | null): {
  /** Icon tile: fill and icon colour together. */
  tile: string;
  /** Icon colour alone, plus its hover, for the collapsed rail. */
  icon: string;
} {
  switch (parseSubscription(subscriptionType).tier) {
    case "lifetime":
      return {
        tile: "bg-amber-100 text-amber-700",
        icon: "text-amber-600 hover:bg-amber-100 hover:text-amber-700",
      };
    case "standard":
      return {
        tile: "bg-blue-100 text-blue-700",
        icon: "text-blue-500 hover:bg-blue-100 hover:text-blue-600",
      };
    case "free":
      return {
        tile: "bg-gray-100 text-gray-600",
        icon: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      };
  }

  // A tier the backend added since — visible, and plainly not one of ours.
  return {
    tile: "bg-blue-100 text-cyan-700",
    icon: "text-cyan-600 hover:bg-blue-100 hover:text-cyan-700",
  };
}

/**
 * The navbar badge.
 *
 * Tier only. The billing period and the printer bundle are detail the sidebar
 * card has room for; a pill in a nav row does not, and "STANDARD-SEMI-ANNUAL"
 * would push the rest of the row off a phone.
 */
export function planBadge(subscriptionType?: string | null): {
  label: string;
  /** Tailwind classes for the badge, keyed to how much the plan is worth. */
  className: string;
} {
  const { tier, raw } = parseSubscription(subscriptionType);

  switch (tier) {
    case "lifetime":
      return {
        label: "LIFETIME",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
      };
    case "standard":
      return {
        label: "STANDARD",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      };
    case "free":
      return {
        label: "FREE",
        className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
      };
  }

  // Something the backend added since. Show it rather than guess.
  return {
    label: raw.toUpperCase(),
    className: "bg-blue-100 text-cyan-700 hover:bg-blue-100",
  };
}

export const findPlan = (id: PlanId): Plan | undefined =>
  PLANS.find((p) => p.id === id);

export interface Faq {
  question: string;
  answer: string;
}

/* Shown under the plans. */
export const SUBSCRIPTION_FAQS: Faq[] = [
  {
    question: "Can I upgrade my plans?",
    answer:
      "Yes, you can upgrade your plan at any time. When upgrading, you'll get credit for the unused portion of your current subscription.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We currently accept FonePay QR payment for all subscription plans.",
  },
  {
    question: "What happens to my data if I go back to Free?",
    answer:
      "Nothing is deleted. Your invoices, products and customers stay exactly as they are — you simply lose access to the paid features and to history older than 30 days until you subscribe again.",
  },
  {
    question: "How does the Lifetime plan work?",
    answer:
      "The Lifetime plan requires a one-time payment that gives you permanent access to all the features included in the plan at the time of purchase, plus all future updates and improvements.",
  },
  {
    question: "Do I need to rent a printer?",
    answer:
      "No, printer rental is optional. you can either pay a monthly fee to rent a printer from us (Rs 100/month) or use your own printer at no extra cost.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Cancelling stops the next renewal and leaves the plan running until the period you have paid for ends. There is no cancellation fee.",
  },
  {
    question: "What kind of printer is provided?",
    answer:
      "We provide a high-quality thermal receipt printer that is compatible with our POS system. It includes installation, maintenance, and support for duration of your subscription.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a 7-day money-back quarantee for all paid plans. If you're not satisfied with our service, you can request a full refund within 7 days of purchase.",
  },
];
