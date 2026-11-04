import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  HeartHandshake,
  Sparkles,
  TrendingUp,
  UsersRound,
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
    icon: Boxes,
    title: "Stock and pricing",
    description:
      "Spot slow-moving products, review pricing opportunities, and explore product combinations.",
    examples: ["Slow-moving items", "Pricing opportunities", "Menu ideas"],
  },
  {
    icon: HeartHandshake,
    title: "Customer retention",
    description:
      "Explore customer activity and find opportunities to encourage repeat visits.",
    examples: ["Retention patterns", "Loyalty activity", "Repeat visits"],
  },
  {
    icon: UsersRound,
    title: "Staffing and seasonal planning",
    description:
      "Use demand patterns to plan staffing and prepare for seasonal changes.",
    examples: ["Hourly playbook", "Staffing suggestions", "Seasonal prep"],
  },
];

export default function AiRecommendationsSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="scroll-mt-20 bg-[#f7f8fb] px-6 py-20 dark:bg-[#131a29] md:px-16">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommendationThemes.map(
            ({ icon: Icon, title, description, examples }) => (
              <article
                key={title}
                className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/10 dark:bg-[#0f1420] sm:p-7"
              >
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
