"use client";

import {
  CheckCircle2,
  Lightbulb,
  PackageSearch,
  Tags,
  TrendingUp,
  Users,
  Sparkles,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  BellRing,
  UtensilsCrossed,
  HeartHandshake,
  Clock,
  ChartNoAxesCombined,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import AiInsightsImageSlider from "./AiInsightsImageSlider";
import HomeAiBusinessStory from "./HomeAIBusinessStory";

type InsightContent = {
  key: string;
  title: string;
  info: string;
  icon: LucideIcon;
};

const insightsContents: InsightContent[] = [
  {
    key: "business-insight-story",
    title: "Business Insight Story",
    info: "Track your daily performance with comparison to past day performance.",
    icon: Lightbulb,
  },
  {
    key: "business-insight-alerts",
    title: "Business Insight & Alerts",
    info: "Stay informed about product stock levels, attention suggestions, important performance shifts, and more.",
    icon: BellRing,
  },
  {
    key: "ai-menu-suggestions",
    title: "AI Menu Suggestions",
    info: "Discover profitable menu combinations, complementary products, and new selling opportunities.",
    icon: UtensilsCrossed,
  },
  {
    key: "ai-customer-retention",
    title: "Customer Retention Radar",
    info: "Identify customer loyalty patterns, spot potential churn, and find ways to encourage repeat purchases.",
    icon: HeartHandshake,
  },
  {
    key: "ai-slow-items",
    title: "Slow-Moving Items Insights",
    info: "Identify products with declining sales and discover ways to improve stock movement.",
    icon: PackageSearch,
  },
  {
    key: "ai-pricing",
    title: "Pricing Opportunities",
    info: "Analyze product pricing and margins to identify opportunities for better profitability.",
    icon: Tags,
  },
  {
    key: "ai-hour-by-hour",
    title: "Hour-by-Hour Playbook",
    info: "Understand hourly sales patterns and plan promotions, preparation, and operations around peak periods.",
    icon: Clock,
  },
  {
    key: "ai-sales-recommendations",
    title: "Sales Recommendations",
    info: "Get actionable suggestions to increase sales, improve product performance, and grow revenue.",
    icon: ChartNoAxesCombined,
  },
  {
    key: "ai-staffing",
    title: "Staffing Recommendations",
    info: "Align staff schedules with customer demand and peak business hours for smoother operations.",
    icon: Users,
  },
  {
    key: "ai-festival-prep",
    title: "Upcoming Festival Prep",
    info: "Prepare for upcoming festivals with demand forecasts, inventory planning, and seasonal product ideas.",
    icon: CalendarDays,
  },
  {
    key: "ai-offer-events",
    title: "AI Fill (Offer creation form)",
    info: "Generate tailored promotional offers with suggested discounts, campaign ideas, and product selections.",
    icon: Megaphone,
  },
  {
    key: "forecast",
    title: "What's Coming Forecast",
    info: "Anticipate future sales, customer demand, and inventory needs using historical business trends.",
    icon: TrendingUp,
  },
];

const aiInsightImages = [
  {
    src: "/ai-business-story.png",
    alt: "AI-generated business performance story and sales insights dashboard",
    title: "Business Insight Story",
  },
  {
    src: "/period-picker.png",
    alt: "Date and period selector for business analytics and AI insights",
    title: "Flexible Analytics Periods",
  },
  {
    src: "/ai-menu-suggestions.png",
    alt: "AI-powered menu suggestions and product combination recommendations",
    title: "AI Menu Suggestions",
  },
  {
    src: "/customer-retention.png",
    alt: "Customer retention analytics and repeat purchase opportunities",
    title: "Customer Retention Radar",
  },
  {
    src: "/slow-moving-items.png",
    alt: "Slow-moving product analysis and inventory improvement suggestions",
    title: "Slow-Moving Items Insights",
  },
  {
    src: "/pricing-opportunities.png",
    alt: "Product pricing analysis and profitability improvement opportunities",
    title: "Pricing Opportunities",
  },
  {
    src: "/hour-by-hour-playbook.png",
    alt: "Hourly sales trends and business activity analysis",
    title: "Hour-by-Hour Playbook",
  },
  {
    src: "/sales-recommendations.png",
    alt: "AI-powered sales recommendations and revenue growth opportunities",
    title: "Sales Recommendations",
  },
  {
    src: "/staffing-recommendations.png",
    alt: "Staffing recommendations based on hourly sales and customer demand",
    title: "Staffing Recommendations",
  },
  {
    src: "/upcoming-festival-prep.png",
    alt: "Festival preparation insights for seasonal demand and inventory planning",
    title: "Upcoming Festival Prep",
  },
];

type AiInsightsSectionProps = {
  isAPIKeySet: boolean;
};

const AiInsightsSection = ({ isAPIKeySet }: AiInsightsSectionProps) => {
  return (
    <section
      id="ai-insights"
      className="scroll-mt-20 bg-[#f7f8fb] px-6 pt-20 dark:bg-[#131a29] md:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#244074] dark:text-[#7ba2e3]">
            AI Business Insights
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4] md:text-4xl">
            Make smarter business decisions
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Turn your business data into actionable insights. Connect your own
            Gemini API key to unlock AI-powered recommendations for your
            business.
          </p>
        </div>

        <div className="lg:col-span-2 mb-6">
          <AiInsightsImageSlider images={aiInsightImages} interval={4000} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* AI features */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1420] sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e8ecf4]">
                What you can discover
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-[#9aa6bd]">
                Get recommendations tailored to your business performance.
              </p>
            </div>

            <div className="space-y-6 max-h-90 overflow-y-auto scrollbar-hide">
              {insightsContents.map(({ key, title, info, icon: Icon }) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2fb] text-[#244074] dark:bg-[#244074]/30 dark:text-[#7ba2e3]">
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e8ecf4]">
                      {title}
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                      {info}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAPIKeySet ? (
            <>
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1420] sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-500/10"
                />

                <div className="relative flex flex-1 flex-col">
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#244074] text-white shadow-sm">
                      <Sparkles size={23} aria-hidden="true" />
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      AI Ready
                    </span>
                  </div>

                  {/* Description */}
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4]">
                    Your AI assistant is ready
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                    Turn your business data into actionable insights. Discover
                    opportunities, understand performance trends, and make
                    smarter decisions with AI-powered analysis.
                  </p>

                  {/* Features */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                        Analyze sales, revenue, and business performance
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                        Identify stock, pricing, and menu opportunities
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                        Get recommendations tailored to your business
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-8 border-t border-gray-200 pt-5 dark:border-white/10">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#244074] px-5  text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1b3159]  hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1420]">
                      <Link
                        href="/dashboard/insights"
                        className="flex items-center justify-center gap-2 py-3"
                      >
                        <Sparkles size={17} aria-hidden="true" />
                        Explore AI Insights
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </button>

                    <div className="mt-3 flex items-start justify-center gap-2">
                      <ShieldCheck
                        size={15}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
                      />
                      <p className="text-left text-xs leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                        Powered by your configured Gemini API key. Usage is
                        subject to Google&apos;s API limits and pricing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1420] sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-500/10"
              />

              <div className="relative flex flex-1 flex-col">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#244074] text-white shadow-sm">
                    <Sparkles size={23} aria-hidden="true" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Setup required
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4]">
                  Unlock your AI assistant
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                  Connect your AI Provider&lsquo;s API key to start generating
                  insights based on your sales, inventory, pricing, and staffing
                  data.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-[#244074] dark:text-[#7ba2e3]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                      Personalized business recommendations
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-[#244074] dark:text-[#7ba2e3]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                      Insights from your business data
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-[#244074] dark:text-[#7ba2e3]"
                    />
                    <span className="text-sm text-gray-600 dark:text-[#b5bfd1]">
                      Use your own AI Provider API key
                    </span>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-5 dark:border-white/10">
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#244074] px-5  text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1b3159]  hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1420]">
                    <Link
                      href={"/settings/api-keys"}
                      className="flex items-center justify-center py-3 gap-2"
                    >
                      <KeyRound size={17} aria-hidden="true" />
                      Configure Gemini API Key
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </button>

                  <div className="mt-3 flex items-start justify-center gap-2">
                    <ShieldCheck
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
                    />
                    <p className="text-left text-xs leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                      Your API key is managed through your business AI settings.
                      Usage is subject to Google&lsquo;s API limits and pricing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isAPIKeySet && (
          <div className="w-full ">
            <HomeAiBusinessStory />
          </div>
        )}
      </div>
    </section>
  );
};

export default AiInsightsSection;
