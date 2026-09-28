"use client";

import { useState } from "react";
import type { HelpFaq } from "@/lib/help/content";

/**
 * The home page's questions, opening and closing on their own height.
 *
 * A client component for one reason: `<details>` cannot be animated. Its
 * content is in the layout or it is not, with nothing in between, and the
 * `::details-content` transition that would fix that is too new to rely on
 * here. So this is the grid trick the Help page uses — a track animated from
 * `0fr` to `1fr`, which the browser can interpolate — wrapped in the least
 * state that makes it work.
 *
 * One open at a time: on a two-column grid, several open at once leaves
 * ragged holes between the cards.
 */
export default function HomeFaq({ faqs }: { faqs: HelpFaq[] }) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-6">
      {faqs.map((faq) => {
        const open = openQuestion === faq.q;
        return (
          <div
            key={faq.q}
            className={`h-fit rounded-2xl border bg-white px-5 transition-colors dark:bg-[#161d2e] ${
              open
                ? "border-[#b9c5da]"
                : "border-gray-200/80 hover:border-[#b9c5da] dark:border-white/10 dark:hover:border-white/25"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenQuestion(open ? null : faq.q)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-[#1b2537] dark:text-[#e8ecf4]"
            >
              {faq.q}
              {/* The plus that becomes a minus, as on the Help page. */}
              <span
                aria-hidden
                className="relative h-4 w-4 shrink-0 text-[#244074] dark:text-[#7ba2e3]"
              >
                <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
                <span
                  className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-200 ${
                    open ? "scale-y-0" : "scale-y-100"
                  }`}
                />
              </span>
            </button>

            {/* `inert` while closed: the answer stays mounted so it has a
                height to grow into, and this keeps it out of tab order and
                the accessibility tree meanwhile. */}
            <div
              inert={!open}
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                open
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-8 text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
