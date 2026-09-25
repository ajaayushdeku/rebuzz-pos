"use client";

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";

export type StepAccent =
  | "emerald"
  | "blue"
  | "violet"
  | "amber"
  | "gray"
  | "rose";

/**
 * The step's colour. It frames the card, its number bubble and its icon tile,
 * so a step is identifiable at a glance from the edge of the page.
 *
 * `solid` is the fuller shade the number and the icon fill with while the step
 * is being worked on.
 */
const ACCENTS: Record<
  StepAccent,
  {
    tint: string;
    border: string;
    icon: string;
    ink: string;
    solid: string;
  }
> = {
  emerald: {
    tint: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    ink: "text-emerald-700",
    solid: "#10b981",
  },
  blue: {
    tint: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    ink: "text-blue-700",
    solid: "#3b82f6",
  },
  violet: {
    tint: "bg-violet-50",
    border: "border-violet-200",
    icon: "text-violet-600",
    ink: "text-violet-700",
    solid: "#8b5cf6",
  },
  rose: {
    tint: "bg-rose-50",
    border: "border-rose-200",
    icon: "text-rose-600",
    ink: "text-rose-700",
    solid: "#f65c85",
  },
  amber: {
    tint: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    ink: "text-amber-700",
    solid: "#f59e0b",
  },
  gray: {
    tint: "bg-gray-50",
    border: "border-gray-200",
    icon: "text-gray-600",
    ink: "text-gray-700",
    solid: "#9aa0a6",
  },
};

export default function OfferStepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  accent = "gray",
  action,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: StepAccent;
  action?: ReactNode;
  children: ReactNode;
}) {
  const tone = ACCENTS[accent];

  return (
    <div
      className="offer-step group relative flex items-start gap-3 sm:gap-4"
      style={
        {
          "--accent": tone.solid,
          // Steps arrive one after another rather than all at once, so the
          // order of the form is legible before anything is read.
          animationDelay: `${(step - 1) * 70}ms`,
        } as CSSProperties
      }
    >
      {/* `z-10`: the card is a later positioned sibling, so without it the
          card paints over the half of the bubble that straddles its edge. */}
      <span
        className={`absolute left-[-15px] z-10 mt-5.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold tabular-nums transition-colors duration-300 ease-out group-hover:border-(color:--accent) group-hover:bg-(color:--accent) group-hover:text-white group-focus-within:border-(color:--accent) group-focus-within:bg-(color:--accent) group-focus-within:text-white sm:flex ${tone.tint} ${tone.border} ${tone.ink}`}
      >
        {step}
      </span>

      {/* One frame, not two: the card used to draw a bordered shadowed box and
          then a second shadowed box inside it. */}
      <div
        className={`relative min-w-0 flex-1 rounded-2xl border bg-white px-5 py-4 md:px-6 ${tone.border}`}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              /* At rest the tile is a pale frame in the icon's own hue; it
                 fills with the accent once the step is in play. */
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 transition-colors duration-300 ease-out group-hover:bg-(color:--accent) group-hover:text-white group-focus-within:bg-(color:--accent) group-focus-within:text-white ${tone.tint} ${tone.icon}`}
              >
                <Icon size={16} />
              </span>
            )}

            <div className="min-w-0">
              <h2
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                {/* The bubble beside the card is hidden below `sm`, so the
                    step number rides the title there instead. */}
                <span
                  className="sm:hidden"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  {step}.
                </span>
                <span className="truncate">{title}</span>
              </h2>
              {subtitle && (
                <p
                  className="mt-0.5 text-xs tracking-wide"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action}
        </div>

        {children}
      </div>

      <style jsx>{`
        @keyframes offerStepIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        :global(.offer-step) {
          animation: offerStepIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* Someone who asked for less motion gets the layout, not the entrance. */
        @media (prefers-reduced-motion: reduce) {
          :global(.offer-step) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
