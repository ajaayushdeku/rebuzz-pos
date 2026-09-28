import { HOME_FAQS } from "@/lib/help/content";
import HomeFaq from "./HomeFaq";

/**
 * * ── FAQ ──
 * The questions a visitor asks before signing up, answered with the
 * same text the Help page uses — one set of answers, two places they
 * are read.
 *
 * The list itself is a client component, because opening one should
 * be animated and `<details>` cannot be: its content is in the layout
 * or it is not, with nothing in between. *
 */
export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E26924]">
            Before you start
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#1b2537] md:text-4xl dark:text-[#e8ecf4]">
            Questions people ask first
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            The short answers. There are more of them, and a way to reach a
            person, once you are signed in.
          </p>
        </div>

        <HomeFaq faqs={HOME_FAQS} />
      </div>
    </section>
  );
}
