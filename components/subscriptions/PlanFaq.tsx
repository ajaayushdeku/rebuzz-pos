"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { SUBSCRIPTION_FAQS, type Faq } from "@/lib/config/plans";
import { ComponentHeader } from "../ComponentHeader";

/**
 * One question and its answer.
 *
 * Animating to a height nobody measured: a one-row grid can transition
 * between `0fr` and `1fr`, which `max-height` cannot do without a guessed
 * ceiling that either clips a long answer or makes a short one crawl.
 *
 * The answer stays mounted so there is something to transition — `inert`
 * keeps it out of the tab order and away from screen readers while closed.
 */
function FaqRow({
  faq,
  isOpen,
  onToggle,
}: {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white transition-colors",
        isOpen ? "border-gray-200" : "border-gray-100 hover:border-gray-200",
      )}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left"
      >
        <span className="text-[13px] font-semibold text-gray-800">
          {faq.question}
        </span>

        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-300 ease-out motion-reduce:transition-none",
            isOpen && "rotate-180 text-blue-600",
          )}
        />
      </button>

      <div
        id={panelId}
        inert={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 text-[13px] leading-relaxed text-gray-600">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The questions under the plans.
 *
 * One answer open at a time: with six of them, letting every row open at once
 * turns the section into a wall of text and pushes the rest off screen.
 * Clicking the open row closes it again.
 */
export default function PlanFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mt-8 flex flex-col gap-4">
      <div className="mx-2 mb-2">
        <ComponentHeader
          title="Frequently Asked Questions"
          subHeader="Everything else worth knowing before you pick a plan"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        {SUBSCRIPTION_FAQS.map((faq, i) => (
          <FaqRow
            key={faq.question}
            faq={faq}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
          />
        ))}
      </div>
    </section>
  );
}
