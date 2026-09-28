"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Plan, PlanId } from "@/lib/config/plans";

/**
 * How many features a card shows before it asks to be opened.
 *
 * Four is enough to tell the plans apart. The rest are a plan's detail, and
 * a card that lists twelve of them stops being a card.
 */
const SHOWN = 4;

/**
 * The plans, side by side, with the rest of each feature list behind a
 * button.
 *
 * A client component for the state, and the state is per plan rather than
 * one open at a time: these are cards to compare, so opening Yearly to see
 * what it adds and then closing Lifetime to make room would be the opposite
 * of the point.
 *
 * Nothing here is buyable — choosing a plan happens inside the app, against
 * an account that already exists.
 *
 * Below `lg` the three cards do not fit side by side, so they become one
 * card at a time with a pager: three full-height cards stacked is a long
 * scroll through things a reader is trying to compare, not read in order.
 */
export default function PlanCards({ plans }: { plans: Plan[] }) {
  const [expanded, setExpanded] = useState<ReadonlySet<PlanId>>(new Set());
  /** Which plan the small-screen pager is showing. */
  const [index, setIndex] = useState(0);
  const area = useRef<HTMLDivElement | null>(null);
  const inView = useSectionInView(area);

  const toggle = (id: PlanId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div ref={area}>
      {/* Below lg this is a viewport onto a row that slides; at lg it is an
          ordinary three-column grid and the transform is switched off with
          the breakpoint rather than with JavaScript, so nothing has to know
          how wide the screen is. */}
      <div className="overflow-hidden lg:overflow-visible">
        <div
          style={{ "--plan": index } as React.CSSProperties}
          // `transition-[translate]`, not `transition-transform`: in Tailwind v4
          // `translate-x-*` sets the standalone `translate` property, which a
          // transform transition does not cover.
          className="flex items-start transition-[translate] duration-300 ease-out max-lg:translate-x-[calc(var(--plan)*-100%)] motion-reduce:transition-none lg:grid lg:grid-cols-3 lg:gap-5 lg:translate-x-0 lg:transition-none"
        >
          {plans.map((plan) => {
            // The badged plan leads: it is the one being recommended, and on a
            // row of three the eye needs somewhere to start.
            const featured = Boolean(plan.badge);
            const open = expanded.has(plan.id);
            const rest = plan.features.slice(SHOWN);

            return (
              <div
                key={plan.id}
                // Full width of the viewport below lg, so one slide is one
                // card; `shrink-0` keeps the row from squeezing three into the
                // space of one.
                className={`relative flex w-full shrink-0 flex-col rounded-2xl border p-7 lg:w-auto ${
                  featured
                    ? "border-[#244074] bg-[#244074] text-white shadow-xl shadow-[#244074]/20"
                    : "border-gray-200/80 bg-white"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-7 rounded-full bg-[#E26924] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}

                <h3
                  className={`text-lg font-semibold ${featured ? "text-white" : "text-[#1b2537]"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 text-sm leading-relaxed ${featured ? "text-white/60" : "text-gray-500"}`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-6 flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`text-3xl font-bold tracking-tight ${featured ? "text-white" : "text-[#1b2537]"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${featured ? "text-white/50" : "text-gray-400"}`}
                  >
                    {plan.period}
                  </span>
                </div>

                {plan.discount && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`line-through ${featured ? "text-white/40" : "text-gray-400"}`}
                    >
                      {plan.discount.originalPrice}
                    </span>
                    <span className="rounded-full bg-[#E26924]/10 px-2 py-0.5 font-semibold text-[#E26924]">
                      Save {plan.discount.saving}
                    </span>
                  </p>
                )}

                <ul
                  className={`mt-6 flex flex-col gap-3 border-t pt-6 ${
                    featured ? "border-white/10" : "border-gray-200/80"
                  }`}
                >
                  {plan.features.slice(0, SHOWN).map((f) => (
                    <Feature key={f} feature={f} featured={featured} />
                  ))}
                </ul>

                {rest.length > 0 && (
                  <>
                    {/* The same grid trick the FAQs use: a track from `0fr` to
                    `1fr`, which is the one way a browser will animate a
                    height it has not been told. */}
                    <div
                      inert={!open}
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                        open
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="flex flex-col gap-3 pt-3">
                          {rest.map((f) => (
                            <Feature key={f} feature={f} featured={featured} />
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(plan.id)}
                      aria-expanded={open}
                      className={`mt-4 mb-2 inline-flex cursor-pointer items-center gap-1.5 self-start text-xs font-semibold transition-colors ${
                        featured
                          ? "text-[#f0b184] hover:text-white"
                          : "text-[#244074] hover:text-[#E26924]"
                      }`}
                    >
                      {open ? "Show less" : `${rest.length} more features`}
                      <ChevronDown
                        size={14}
                        aria-hidden
                        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                  </>
                )}

                {plan.printerAddon && (
                  // `mt-auto`, so the add-on sits at the foot of the card however
                  // long the list above it runs.
                  <p
                    className={`mt-auto rounded-lg  px-3 py-2.5 text-xs leading-relaxed ${
                      featured
                        ? "bg-white/5 text-white/60"
                        : "bg-gray-50 text-gray-500"
                    } ${plan.features.length ? "mt-6" : ""}`}
                  >
                    Thermal printer {plan.printerAddon.price},{" "}
                    {plan.printerAddon.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pager, small screens only ── */}
      <div className="mt-6 flex items-center justify-center gap-2 lg:hidden">
        {plans.map((plan, i) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show the ${plan.name} plan`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-[#244074]" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Pinned to the middle of the viewport's right edge, and only while
          the plans are on screen: an arrow that outlived its section would
          be a control pointing at nothing. `fixed` rather than sticky
          because the page scrolls inside its own container, and a sticky
          child would ride that container's edge instead of the screen's. */}
      {inView && (
        <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1 rounded-full border border-gray-200/80 bg-white/95 p-1 shadow-lg backdrop-blur lg:hidden">
          <PagerArrow
            direction="prev"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          />
          <PagerArrow
            direction="next"
            disabled={index === plans.length - 1}
            onClick={() => setIndex((i) => Math.min(plans.length - 1, i + 1))}
          />
        </div>
      )}
    </div>
  );
}

/** One arrow of the pager. Disabled at the ends rather than wrapping: with
 *  three plans, wrapping makes "next" ambiguous about where you are. */
function PagerArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous plan" : "Next plan"}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#244074] transition-colors hover:bg-[#eef1f7] disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
    >
      <Icon size={18} aria-hidden />
    </button>
  );
}

/**
 * Whether the plans are on screen.
 *
 * Drives the floating arrows, which should exist only while there is
 * something for them to page through. Observed rather than measured on
 * scroll: the page scrolls inside its own container here, and an
 * IntersectionObserver against the viewport does not care which element
 * moved the element.
 */
function useSectionInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // A little inside the edges, so the arrows go before the last card
      // has quite left rather than hovering over the next section.
      { rootMargin: "-15% 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

function Feature({
  feature,
  featured,
}: {
  feature: string;
  featured: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2
        size={16}
        aria-hidden
        className={`mt-0.5 shrink-0 ${featured ? "text-[#f0b184]" : "text-[#E26924]"}`}
      />
      <span
        className={`text-sm leading-relaxed ${featured ? "text-white/80" : "text-gray-600"}`}
      >
        {feature}
      </span>
    </li>
  );
}
