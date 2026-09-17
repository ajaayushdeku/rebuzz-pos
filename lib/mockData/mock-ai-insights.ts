/**
 * Sample content for the AI Insights page, until generation is wired up.
 *
 * Every item carries an `id` unique across the whole page, so one set of
 * dismissed ids can serve every section and the hero's counts.
 *
 * Money is stored as plain numbers and formatted with the business's currency
 * at render, so the page follows the currency setting like everything else.
 */

export interface PricingOpportunity {
  id: string;
  icon: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  description: string;
  /** Estimated extra revenue a month. */
  monthlyUplift: number;
  /** 0–100. */
  confidence: number;
}

export interface HourInsight {
  id: string;
  /** "3pm", "4–5pm". */
  time: string;
  title: string;
  /** 0–100. */
  occupancy: number;
  description: string;
  tip: string;
}

export interface FestivalPrep {
  id: string;
  /** Matches an id in `FESTIVALS`, which supplies the icon and label. */
  festivalId: string;
  /** Gregorian, YYYY-MM-DD. */
  startDate: string;
  /** Same as `startDate` for a single-day festival. */
  endDate: string;
  description: string;
}

export type RetentionStatus = "At risk" | "Cooling off";

export interface RetentionInsight {
  id: string;
  name: string;
  /** "Regular · 2x/week". */
  profile: string;
  status: RetentionStatus;
  daysSinceVisit: number;
  spendPerVisit: number;
  usualOrder: string;
  tip: string;
}

export interface StaffingInsight {
  id: string;
  label: string;
  text: string;
}

export const MOCK_PRICING: PricingOpportunity[] = [
  {
    id: "price-momo",
    icon: "🥟",
    name: "Steam MoMo",
    currentPrice: 180,
    suggestedPrice: 210,
    description:
      "Sells out by 7pm most days, and demand barely dipped after the last Rs 20 increase — a classic inelastic item. Rs 210 still undercuts nearby competitors.",
    monthlyUplift: 6300,
    confidence: 91,
  },
  {
    id: "price-cold-brew",
    icon: "🧊",
    name: "Cold Brew",
    currentPrice: 320,
    suggestedPrice: 280,
    description:
      "Highly price-sensitive: units fell 31% after the last hike. Dropping to Rs 280 should recover the lost afternoon volume and more than pay for itself.",
    monthlyUplift: 3400,
    confidence: 84,
  },
  {
    id: "price-naan",
    icon: "🫓",
    name: "Cheese Garlic Naan",
    currentPrice: 220,
    suggestedPrice: 250,
    description:
      "An attach-rate item — it's ordered alongside mains and customers rarely check its price separately. Safe margin lift with near-zero volume risk.",
    monthlyUplift: 2100,
    confidence: 88,
  },
];

export const MOCK_RETENTION: RetentionInsight[] = [
  {
    id: "retention-ramesh",
    name: "Ramesh K.",
    profile: "Regular · 2x/week",
    status: "At risk",
    daysSinceVisit: 18,
    spendPerVisit: 850,
    usualOrder: "Cappuccino + Almond Croissant",
    tip: "Send a 'we miss you' message with a free pastry on his next coffee. Costs ~Rs 60, protects roughly Rs 6,800/mo of visits.",
  },
  {
    id: "retention-priya",
    name: "Priya S.",
    profile: "VIP · weekend groups",
    status: "Cooling off",
    daysSinceVisit: 12,
    spendPerVisit: 4200,
    usualOrder: "Family lunch, 6–8 covers",
    tip: "Offer a reserved Cabin table for this Saturday. Her group bookings are among your best weekend margins.",
  },
  {
    id: "retention-blue-tower",
    name: "Blue Tower office crowd",
    profile: "Lunch group · 5–6 pax",
    status: "Cooling off",
    daysSinceVisit: 9,
    spendPerVisit: 2100,
    usualOrder: "Thali set + Lassi round",
    tip: "Their visits halved since the road construction started. A 10% office-lunch code sent via Viber could win the group back.",
  },
];

export const MOCK_STAFFING: StaffingInsight[] = [
  {
    id: "staffing-peak",
    label: "Peak Overload (10am – 11am):",
    text: "Emma Wilson handles 55 orders/hour alone during this window. Consider adding 1 additional staff member during this period.",
  },
  {
    id: "staffing-evening",
    label: "Evening surge (6pm – 7pm):",
    text: "Evening team hit 42 orders/hour with only 2 staff. Recommend rotating a morning barista to cover this window.",
  },
  {
    id: "staffing-top",
    label: "Top Performer:",
    text: "Emma Wilson leads with 245 orders at a fast fulfillment time. Consider a mentoring program.",
  },
];
