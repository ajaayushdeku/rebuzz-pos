import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  HeartHandshake,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

const recommendationThemes = [
  {
    icon: TrendingUp,
    title: "Sales and performance",
    description:
      "Read business summaries, sales trends, forecasts, and suggestions for improving performance.",
    examples: ["Business story", "Sales recommendations", "Forecasts"],
  },
  {
    icon: UtensilsCrossed,
    title: "Menu and product suggestions",
    description:
      "Use sales and product data to explore complementary items, menu combinations, and new opportunities to test.",
    examples: ["Product pairings", "Menu combinations", "Items to test"],
  },
  {
    icon: HeartHandshake,
    title: "Customer retention",
    description:
      "Explore customer activity and find opportunities to encourage repeat visits.",
    examples: ["Retention patterns", "Loyalty activity", "Repeat visits"],
  },
  {
    icon: Clock3,
    title: "Hour-by-hour business playbook",
    description:
      "Understand when demand tends to rise or slow down, then use those patterns to plan preparation and promotions.",
    examples: ["Peak-hour patterns", "Preparation timing", "Promotion windows"],
  },
];

export default function AiRecommendationsSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="scroll-mt-20  px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            AI recommendations by business need
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
            Find guidance for the decisions in front of you.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            Explore recommendations across sales, products, customers, and
            day-to-day planning, based on the business data available to each
            insight.
          </p>
        </div>

        <div className="-mx-6 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-pl-6 px-6 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:snap-none md:overflow-visible md:px-0 md:pb-0">
          {recommendationThemes.map(
            ({ icon: Icon, title, description, examples }) => (
              <div
                key={title}
                className="w-[85%] max-w-[450px] shrink-0 snap-start md:w-auto md:max-w-none "
              >
                <article className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#0f1420] sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0]">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                        {description}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {examples.map((example) => (
                      <li
                        key={example}
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-[#c3ccdc]"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ),
          )}
        </div>

        <Link
          href={token ? "/dashboard/insights" : "#ai-insights"}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
        >
          <Sparkles size={16} aria-hidden="true" />
          {token ? "Explore AI insights" : "See the AI insights demo"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
