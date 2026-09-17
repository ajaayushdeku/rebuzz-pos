/**
 * Sample content for the AI Insights page, until generation is wired up.
 *
 * Every item carries an `id` unique across the whole page, so one set of
 * dismissed ids can serve every section and the hero's counts.
 *
 * Money is stored as plain numbers and formatted with the business's currency
 * at render, so the page follows the currency setting like everything else.
 * Festival dates are stored as Gregorian dates only; the Bikram Sambat label
 * and the "in N days" count are worked out from them when the page renders,
 * so they stay right as the calendar moves.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface MenuSuggestion {
  id: string;
  icon: string;
  title: string;
  /** Estimated extra revenue a week. */
  weeklyUplift: number;
  difficulty: Difficulty;
  description: string;
  /** 0–100. */
  confidence: number;
  ingredients: string[];
}

export type SlowItemTone = "amber" | "blue" | "violet";

export interface SlowItemInsight {
  id: string;
  icon: string;
  name: string;
  /**
   * The short signal beside the name: a change in sales ("-27%") or a pattern
   * ("Morning only").
   */
  signal: string;
  /** Small grey context after the signal: "8/week", "Steady". */
  context: string;
  description: string;
  tip: string;
  /** Label for the action button, e.g. "Rework → Brownie Shake". */
  action: string;
  tone: SlowItemTone;
}

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

export type RecommendationKind = "warning" | "info" | "success";

export interface SalesRecommendation {
  id: string;
  kind: RecommendationKind;
  text: string;
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

export const MOCK_MENU_SUGGESTIONS: MenuSuggestion[] = [
  {
    id: "menu-french-toast",
    icon: "🥐",
    title: "Almond Croissant French Toast",
    weeklyUplift: 4500,
    difficulty: "Easy",
    description:
      "Your Almond Croissants are flying off the shelves! 🔥 Use day-old ones to make a premium French Toast bake — same ingredients, higher margin, and a hot new menu item. Could sell for Rs 450–550 with barely any extra cost.",
    confidence: 94,
    ingredients: [
      "Day-old Almond Croissants",
      "Eggs",
      "Milk",
      "Vanilla extract",
    ],
  },
  {
    id: "menu-smoothie-bowl",
    icon: "🫐",
    title: "Blueberry Muffin Smoothie Bowl",
    weeklyUplift: 3200,
    difficulty: "Easy",
    description:
      "Blueberry Muffins are a bestseller and smoothie bowls are trending. Crumble a muffin on top of a blueberry-acai base — it's a shareable, Instagram-worthy item that uses the same bake you already do.",
    confidence: 87,
    ingredients: [
      "Blueberry Muffin crumble",
      "Acai base",
      "Fresh blueberries",
      "Honey",
    ],
  },
  {
    id: "menu-avocado-wrap",
    icon: "🥑",
    title: "Smashed Avocado Breakfast Wrap",
    weeklyUplift: 2800,
    difficulty: "Medium",
    description:
      "Avocado Toast is your top food seller. Wrap that same filling in a warm tortilla with a soft-boiled egg — a handheld version for grab-and-go customers who love the taste but are in a rush.",
    confidence: 81,
    ingredients: [
      "Avocado spread",
      "Tortilla wrap",
      "Egg",
      "Chilli flakes",
      "Lemon",
    ],
  },
];

export const MOCK_SLOW_ITEMS: SlowItemInsight[] = [
  {
    id: "slow-brownie",
    icon: "🍫",
    name: "Gluten-Free Brownie",
    signal: "-27%",
    context: "8/week",
    description:
      "Margin's thin at 50% and sales are dropping fast. Don't promote as-is.",
    tip: "Rework into a Brownie Shake using the ice cream you already stock — or drop it to free up prep and shelf space.",
    action: "Rework → Brownie Shake",
    tone: "amber",
  },
  {
    id: "slow-scone",
    icon: "🫖",
    name: "Herbal Tea Scone",
    signal: "-33%",
    context: "10/week",
    description:
      "Down 33% and buried at the bottom of the menu. Near-zero sell cost in your dead hours.",
    tip: "Bundle it with Cold Coffee as an afternoon combo and push it 3–5pm when the cafe is nearly empty. The sale costs almost nothing then.",
    action: "Bundle → Afternoon Combo",
    tone: "blue",
  },
  {
    id: "slow-muffin",
    icon: "🫐",
    name: "Blueberry Muffin",
    signal: "Morning only",
    context: "Steady",
    description:
      "Steady seller but only moves in the morning. Missing out on the rest of the day.",
    tip: "Feature it higher on the menu and pair it with coffee to stretch sales past the breakfast rush.",
    action: "Reposition → All-Day Menu",
    tone: "violet",
  },
];

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

export const MOCK_HOURS: HourInsight[] = [
  {
    id: "hour-3pm",
    time: "3pm",
    title: "Deadest Hour",
    occupancy: 13,
    description:
      "Nearly empty — rent and staff are already paid, so anything you sell is near-pure profit.",
    tip: "Run a 3–5pm happy-hour combo to pull in work-from-cafe and student crowd. Push the scone here.",
  },
  {
    id: "hour-4-5pm",
    time: "4–5pm",
    title: "Half Full, Low Spend",
    occupancy: 50,
    description: "People are in but nursing one coffee (avg Rs 79/head).",
    tip: "Prompt a snack with every order — Wai Wai Sadeko or Aloo Chop, quick from the kitchen.",
  },
  {
    id: "hour-7pm",
    time: "7pm",
    title: "Completely Full",
    occupancy: 100,
    description:
      "Kitchen is maxed out. Don't add cook time — push drinks the bar handles.",
    tip: "Sell Cold Coffee, Lassi, and Lemonade instead. Check goes up, kitchen doesn't notice. No food discounts — you'd flood an already slammed kitchen.",
  },
];

export const MOCK_FESTIVALS: FestivalPrep[] = [
  {
    id: "festival-dashain",
    festivalId: "dashain",
    startDate: "2026-10-17",
    endDate: "2026-10-23",
    description:
      "Family-feast season. Pre-stock meat and festive staples, plan a Dashain family platter, and lock staff leave rotas now — everyone asks at once.",
  },
  {
    id: "festival-tihar",
    festivalId: "tihar",
    startDate: "2026-11-08",
    endDate: "2026-11-12",
    description:
      "Sweets and lights sell best: prep mithai gift boxes and evening deals, and decorate early — foot traffic follows the lights.",
  },
  {
    id: "festival-chhath",
    festivalId: "chhath",
    startDate: "2026-11-15",
    endDate: "2026-11-15",
    description:
      "Riverside crowds mean early-morning trade. Open earlier, push warm drinks and fasting-friendly items.",
  },
];

export const MOCK_SALES_RECOMMENDATIONS: SalesRecommendation[] = [
  {
    id: "sales-latte",
    kind: "warning",
    text: '"Latte" sells well but contributes only 12% profit due to high discounting. Review promo frequency.',
  },
  {
    id: "sales-bundle",
    kind: "info",
    text: 'Adding a bundle deal for "Espresso + Croissant" could boost morning revenue by est. 8%.',
  },
  {
    id: "sales-cappuccino",
    kind: "success",
    text: '"Cappuccino" has the best margin ratio. Consider featuring it more prominently.',
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
