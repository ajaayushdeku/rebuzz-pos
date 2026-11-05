"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartHandshake,
  Images,
  Lightbulb,
  PackageSearch,
  Tags,
  Users,
  UtensilsCrossed,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PhotoViewer from "@/components/ui/PhotoViewer";

type ProductExample = {
  src?: string;
  width?: number;
  height?: number;
  icon: LucideIcon;
  category: string;
  title: string;
  summary: string;
  details: string;
  alt: string;
};

const examples: ProductExample[] = [
  {
    src: "/ai-business-story.png",
    width: 1919,
    height: 896,
    icon: Lightbulb,
    category: "BUSINESS INSIGHTS",
    title: "A clearer view of what’s happening",
    summary:
      "Bring daily business signals together in one story, with highlights, stock alerts, and practical actions to consider.",
    details:
      "Get a unified overview of current sales, orders, and profit compared with the previous day, alongside patterns such as top products and busy hours. Stay informed about low stock, unusual performance changes, and other meaningful business signals while there is still time to respond. Compare like-for-like days and check the underlying sales or product view before changing a plan. Figures shown in this image are illustrative sample data.",
    alt: "Illustrative Rebuzz AI business insights dashboard showing business performance, alerts, and stock signals",
  },
  {
    src: "/ai-menu-suggestions.png",
    width: 1920,
    height: 906,
    icon: UtensilsCrossed,
    category: "PRODUCT IDEAS",
    title: "Find ideas for products and menus",
    summary:
      "Use product sales and cost information to explore combinations and opportunities.",
    details:
      "Menu suggestions can highlight product combinations and ideas to consider using the available product and sales data. Check whether customers already buy the items together, whether the pairing makes sense for a common need, and whether each item is in stock. Review the cost and margin before offering a bundle or discount, then test one idea at a time. Suggestions are starting points for your own review, not guaranteed business outcomes. The figures shown in this image are illustrative sample data.",
    alt: "Illustrative Rebuzz AI product suggestions screen",
  },
  {
    src: "/customer-retention.png",
    width: 1920,
    height: 911,
    icon: HeartHandshake,
    category: "CUSTOMER RETENTION",
    title: "Give customers a reason to return",
    summary:
      "Understand repeat-purchase patterns and make follow-up more relevant to each customer.",
    details:
      "Retention insights can help identify changes in visit frequency and opportunities to reconnect. Compare each customer's activity with their usual buying rhythm: a weekly shopper and a seasonal shopper should not be treated alike. Consider whether a relevant reminder, helpful service, or carefully chosen offer would give them a reason to return. Use customer information responsibly and only send outreach in line with the permissions you have. Review repeat visits afterward to learn whether the action helped.",
    alt: "Illustrative Rebuzz customer retention insights screen",
  },
  {
    src: "/slow-moving-items.png",
    width: 1920,
    height: 911,
    icon: PackageSearch,
    category: "INVENTORY INSIGHTS",
    title: "Find a better path for slow-moving stock",
    summary:
      "Spot products losing momentum and review stock, seasonality, and sales before taking action.",
    details:
      "Slow movement may point to a seasonal lull, a visibility issue, or stock that no longer fits demand. First confirm the stock count, recent availability, and whether the product is seasonal. Compare with a similar period rather than relying on a single quiet week. Possible responses include a smaller reorder, better placement, pairing the item with a complementary product, or a measured promotion. Review margin and expiry risk before discounting, then check whether the change improved movement.",
    alt: "Illustrative Rebuzz slow-moving items analysis screen",
  },
  {
    src: "/pricing-opportunities.png",
    width: 1920,
    height: 911,
    icon: Tags,
    category: "PRICING & MARGINS",
    title: "Review prices with margin in mind",
    summary:
      "Explore pricing opportunities by looking at product costs, sales volume, and customer context together.",
    details:
      "A price that looks low or high in isolation can tell an incomplete story. Check that cost records are current, account for discounts and taxes, and consider the product's role alongside nearby alternatives. Compare units sold and margin together; a price change that raises revenue may still reduce what remains after costs. If a change is justified, adjust a limited set of products first and review the result after enough transactions have accumulated.",
    alt: "Illustrative Rebuzz product pricing opportunities screen",
  },
  {
    src: "/hour-by-hour-playbook.png",
    width: 1920,
    height: 911,
    icon: Clock3,
    category: "DAILY OPERATIONS",
    title: "Plan around the rhythm of your day",
    summary:
      "Use recurring hourly demand to prepare stock, schedule coverage, and choose when to run promotions.",
    details:
      "Hourly patterns help distinguish a repeatable rush from a one-off busy period. Compare similar weekdays and note holidays, promotions, or unusual closures that could distort the pattern. Use recurring peaks to prepare popular items, plan team handovers, and place routine work in quieter windows. Sales are only one measure of workload, so include preparation and service needs in the plan. Revisit the schedule as seasons and customer habits change.",
    alt: "Illustrative Rebuzz hour-by-hour sales playbook screen",
  },
  {
    src: "/sales-recommendations.png",
    width: 1920,
    height: 911,
    icon: ChartNoAxesCombined,
    category: "SALES & PERFORMANCE",
    title: "Turn sales patterns into next steps",
    summary:
      "Explore product performance and review recommendations based on sales activity.",
    details:
      "Recommendations can call attention to changes in sales, discounts, pricing, and product costs where that information is available. Choose one opportunity to investigate, check the dates and records behind it, then decide on a small action you can measure. Set a baseline first and compare the result afterward. Review each suggestion against your own records before acting; figures shown here are illustrative sample data.",
    alt: "Illustrative Rebuzz AI sales recommendations screen",
  },
  {
    src: "/staffing-recommendations.png",
    width: 1920,
    height: 911,
    icon: Users,
    category: "TEAM PLANNING",
    title: "Match team coverage to customer demand",
    summary:
      "Use demand patterns as one input when planning staffing, handovers, and daily coverage.",
    details:
      "Sales and transaction timing can help show when workload tends to build. Compare similar trading days and account for deliveries, preparation, customer service, and other tasks that sales alone may not capture. Use recurring peaks as one input to coverage and handovers, while balancing staff availability, skills, breaks, and applicable employment rules. Forecasts are estimates, so review schedules with the team and adjust when demand or availability changes.",
    alt: "Illustrative Rebuzz staffing recommendations screen",
  },
  {
    src: "/upcoming-festival-prep.png",
    width: 1920,
    height: 911,
    icon: CalendarDays,
    category: "SEASONAL PLANNING",
    title: "Prepare for the next seasonal rush",
    summary:
      "Connect festival dates and past demand to inventory, staffing, and promotion plans.",
    details:
      "Seasonal preparation works best when it reflects your community and your own sales history. Confirm the dates against a trusted local calendar, then look at which products moved during comparable occasions. Check supplier lead times, current stock, and staffing before placing larger orders. Keep a fallback plan in case demand differs from the estimate. After the event, compare the plan with actual sales and stock so next season's decisions can be more grounded.",
    alt: "Illustrative Rebuzz festival preparation insights screen",
  },
];

const FEATURE_DESTINATIONS: Record<
  string,
  { label: string; href: string; detail: string }
> = {
  "BUSINESS INSIGHTS": {
    label: "AI Insights",
    href: "/dashboard/ai-insights",
    detail:
      "Review the story beside the sales and transaction data for its period.",
  },
  "PRODUCT IDEAS": {
    label: "AI Insights",
    href: "/dashboard/ai-insights",
    detail:
      "Compare product combinations with actual sales and cost information.",
  },
  "CUSTOMER RETENTION": {
    label: "Customers",
    href: "/dashboard/customers",
    detail:
      "Review customer activity and repeat visits before planning outreach.",
  },
  "INVENTORY INSIGHTS": {
    label: "Inventory",
    href: "/dashboard/inventory",
    detail: "Check current stock and recent movement before changing an order.",
  },
  "PRICING & MARGINS": {
    label: "Products & Pricing",
    href: "/records/products",
    detail: "Review product prices and costs before making a pricing change.",
  },
  "DAILY OPERATIONS": {
    label: "AI Insights",
    href: "/dashboard/ai-insights",
    detail: "Use hourly patterns to plan preparation and review busy periods.",
  },
  "SALES & PERFORMANCE": {
    label: "Sales & Revenue",
    href: "/dashboard/sales-revenue",
    detail:
      "Compare sales trends with the dates and measures behind a recommendation.",
  },
  "TEAM PLANNING": {
    label: "Employees",
    href: "/dashboard/employee",
    detail: "Use demand patterns alongside staff availability and shift needs.",
  },
  "SEASONAL PLANNING": {
    label: "Offers",
    href: "/offers",
    detail:
      "Plan an offer around confirmed dates, then check its terms before sharing.",
  },
};

export default function ProductExamplesSection({ token }: { token?: string }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const example = examples[pageIndex];
  const featureDestination =
    FEATURE_DESTINATIONS[example.category] ??
    FEATURE_DESTINATIONS["BUSINESS INSIGHTS"];

  const turnPage = (turn: "next" | "previous") => {
    if (turn === "previous" && pageIndex === 0) return;
    if (turn === "next" && pageIndex === examples.length - 1) return;

    setExpanded(false);
    setPageIndex((current) =>
      turn === "next"
        ? Math.min(current + 1, examples.length - 1)
        : Math.max(current - 1, 0),
    );
  };

  return (
    <section
      id="ai-insights"
      className="scroll-mt-20 px-6 py-20 md:px-16  bg-[#f7f8fb] dark:bg-[#131a29]"
    >
      <div className="mx-auto max-w-6xl">
        {/* Blog heading */}
        <header className="mb-10 border-b border-gray-200 pb-8 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E26924]">
            <Images size={15} />
            Product Examples
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Understanding your business, one insight at a time.
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-[#9aa6bd]">
            Explore practical guides, business intelligence, and AI-powered
            recommendations designed to help you make more informed decisions
            with Rebuzz.
          </p>
        </header>

        {/* Article navigation */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-[#244074] dark:text-[#7ba2e3]">
              AI INSIGHTS GUIDE
            </span>
            <span>/</span>
            <span>Article {String(pageIndex + 1).padStart(2, "0")}</span>
          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500">
            {examples.length} articles
          </span>
        </div>

        {/* Main article */}
        <article>
          {/* Article heading */}
          <div className="mb-8">
            <span className="inline-flex rounded-md bg-[#244074]/[0.07] px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-[#244074] dark:bg-[#7ba2e3]/10 dark:text-[#9bb8eb]">
              {example.category}
            </span>

            <h3 className="mt-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
              {example.title}
            </h3>

            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-[#b5bfd1]">
              {example.summary}
            </p>
          </div>

          {/* Article content with alternating image */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
            <div className="min-w-0">
              {/* One consistent image and text layout for every article. */}
              <div className="grid items-start gap-7 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)]">
                {/* Image */}
                <figure className="min-w-0">
                  {example.src ? (
                    <div className="group/image relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#0f1420]">
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={example.width ?? 1920}
                        height={example.height ?? 911}
                        className="h-auto w-full object-contain"
                        sizes="(min-width: 1024px) 380px, 100vw"
                        priority={pageIndex === 0}
                      />
                      <button
                        type="button"
                        onClick={() => setImageOpen(true)}
                        aria-label={`Open full-size image: ${example.title}`}
                        title="Open full-size image"
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#244074]"
                      >
                        <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-black/55 text-white opacity-80 shadow-lg transition duration-200 group-hover/image:scale-100 group-hover/image:bg-[#244074]/90 group-hover/image:opacity-100 group-focus-within/image:scale-100 group-focus-within/image:opacity-100">
                          <ZoomIn size={22} aria-hidden="true" />
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-[#e9eef8] via-white to-[#f6e9e5] dark:border-white/10 dark:from-[#1b2b47] dark:via-[#121b2b] dark:to-[#2b222a]">
                      <div className="flex flex-col items-center gap-3">
                        <example.icon
                          size={42}
                          strokeWidth={1.5}
                          className="text-[#244074] dark:text-[#9bb8f0]"
                        />
                        <span className="text-xs font-semibold tracking-wider text-gray-500">
                          REBUZZ AI INSIGHTS
                        </span>
                      </div>
                    </div>
                  )}

                  <figcaption className="mt-2 text-center text-[11px] leading-5 text-gray-400 dark:text-gray-500">
                    Illustrative Rebuzz AI Insights interface. Sample data shown
                    for demonstration.
                  </figcaption>
                </figure>

                {/* Article text */}
                <div className="min-w-0">
                  <p className="text-sm leading-7 text-gray-700 dark:text-[#b5bfd1]">
                    {example.details
                      .split(". ")
                      .slice(0, expanded ? undefined : 2)
                      .join(". ")}
                    {!expanded && example.details.split(". ").length > 2
                      ? "."
                      : ""}
                  </p>

                  {!expanded && example.details.split(". ").length > 2 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
                    >
                      Continue reading
                      <ArrowRight size={15} />
                    </button>
                  )}

                  {expanded && (
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
                    >
                      Show less
                      <ArrowRight size={15} className="-rotate-90" />
                    </button>
                  )}
                </div>
              </div>

              {/* Additional article information */}
              <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10">
                <h4 className="text-lg font-bold text-[#1b2537] dark:text-[#e8ecf4]">
                  What to keep in mind
                </h4>

                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-[#b5bfd1]">
                  AI-generated insights are intended to support your
                  decision-making, not replace your judgment. Always review the
                  underlying business records and consider your own business
                  circumstances before taking action.
                </p>
              </div>

              {/* Article navigation */}
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => turnPage("previous")}
                  disabled={pageIndex === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#244074] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-[#9bb8f0] dark:hover:bg-white/5"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span
                  aria-live="polite"
                  className="text-xs font-medium tabular-nums text-gray-400"
                >
                  {String(pageIndex + 1).padStart(2, "0")} /{" "}
                  {String(examples.length).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={() => turnPage("next")}
                  disabled={pageIndex === examples.length - 1}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#244074] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1b325c] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="h-fit space-y-6 lg:sticky lg:top-24">
              <div className="rounded-xl border border-[#dce5f3] bg-[#f7f9fd] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2 text-[#244074] dark:text-[#9bb8eb]">
                  <example.icon size={17} aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Explore in Rebuzz
                  </h4>
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {featureDestination.detail}
                </p>

                <Link
                  href={token ? featureDestination.href : "/login"}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 dark:text-[#9bb8eb] dark:focus-visible:ring-offset-[#131a29]"
                >
                  {token
                    ? `Open ${featureDestination.label}`
                    : `Log in to open ${featureDestination.label}`}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <div className="text-xs leading-6 text-gray-400 dark:text-gray-500">
                <p className="font-semibold text-gray-500 dark:text-gray-400">
                  Disclaimer
                </p>
                Examples and figures are illustrative and do not represent
                guaranteed results.
              </div>
            </aside>
          </div>
        </article>

        {/* Bottom navigation */}
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 dark:border-white/10 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Browsing article {pageIndex + 1} of {examples.length}
          </p>

          <Link
            href={token ? "/dashboard/insights" : "#ai-insights"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
          >
            {token ? "Explore AI insights" : "See how AI insights work"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <PhotoViewer
        open={imageOpen}
        src={example.src ?? null}
        alt={example.alt}
        onClose={() => setImageOpen(false)}
      />
    </section>
  );
}
