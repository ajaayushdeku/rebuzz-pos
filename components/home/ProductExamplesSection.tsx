import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";

const examples = [
  {
    src: "/ai-business-story.png",
    width: 1919,
    height: 906,
    title: "Business insight story",
    description:
      "A summary view that brings business signals and suggested actions together.",
    alt: "Illustrative Rebuzz AI business insight story screen",
  },
  {
    src: "/sales-recommendations.png",
    width: 1920,
    height: 911,
    title: "Sales recommendations",
    description:
      "An example of how sales and product data can be presented with recommendations.",
    alt: "Illustrative Rebuzz AI sales recommendations screen",
  },
  {
    src: "/ai-menu-suggestions.png",
    width: 1920,
    height: 896,
    title: "Product suggestions",
    description:
      "A preview of AI suggestions for product combinations and business opportunities.",
    alt: "Illustrative Rebuzz AI product suggestions screen",
  },
];

export default function ProductExamplesSection({
  token,
}: {
  token?: string;
}) {
  return (
    <section className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start gap-4">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#244074]/10 text-[#244074] dark:bg-[#244074]/30 dark:text-[#9bb8f0] sm:flex">
            <Images size={20} aria-hidden="true" />
          </span>
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
              Product examples
            </p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#1b2537] dark:text-[#e8ecf4] md:text-4xl">
              Take a closer look inside Rebuzz.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              Explore examples of the business story and AI recommendation
              screens.
            </p>
          </div>
        </div>

        <p className="mb-5 rounded-xl border border-[#244074]/15 bg-[#244074]/[0.04] px-4 py-3 text-sm leading-relaxed text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#b5bfd1]">
          The names, figures, and scenarios shown in these screenshots are
          illustrative sample data, not customer results.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {examples.map((example) => (
            <article
              key={example.title}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-white/10 dark:bg-[#161d2e]"
            >
              <Image
                src={example.src}
                alt={example.alt}
                width={example.width}
                height={example.height}
                className="aspect-[16/9] w-full border-b border-gray-200/80 object-cover object-top dark:border-white/10"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="p-5">
                <h3 className="text-base font-semibold text-[#1b2537] dark:text-[#e8ecf4]">
                  {example.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                  {example.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <Link
          href={token ? "/dashboard/insights" : "#ai-insights"}
          className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#244074] transition-colors hover:text-[#E26924] dark:text-[#7ba2e3]"
        >
          {token ? "Explore AI insights" : "See how AI insights work"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
