"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ComponentHeader } from "../ComponentHeader";

export type StepAccent = "emerald" | "blue" | "violet" | "amber" | "gray";

const ACCENTS: Record<
  StepAccent,
  { tint: string; border: string; icon: string; ink: string }
> = {
  emerald: {
    tint: "bg-emerald-100",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    ink: "text-emerald-700",
  },
  blue: {
    tint: "bg-blue-100",
    border: "border-blue-200",
    icon: "text-blue-600",
    ink: "text-blue-700",
  },
  violet: {
    tint: "bg-violet-100",
    border: "border-violet-200",
    icon: "text-violet-600",
    ink: "text-violet-700",
  },
  amber: {
    tint: "bg-amber-100",
    border: "border-amber-200",
    icon: "text-amber-600",
    ink: "text-amber-700",
  },
  gray: {
    tint: "bg-gray-100",
    border: "border-gray-200",
    icon: "text-gray-600",
    ink: "text-gray-700",
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
      className={`relative flex items-start gap-3 sm:gap-4 ${tone.border} rounded-2xl border bg-white  shadow-sm `}
    >
      <span
        className={`absolute left-[-15px] mt-5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums sm:flex ${tone.tint} ${tone.ink}`}
      >
        {step}
      </span>

      <div className="min-w-0 flex-1 rounded-2xl  bg-white px-5 py-4 shadow-sm md:px-6 md:py-4">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          {/* <div className="min-w-0">
            <h2 className="text-base font-bold text-blue-600 md:text-lg">
              <span className="mr-1.5 text-gray-400 sm:hidden">{step}.</span>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[13px] text-gray-500">{subtitle}</p>
            )}
          </div> */}

          <div className="flex items-center gap-3">
            {Icon && (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.tint}`}
              >
                <Icon size={16} className={tone.icon} />
              </span>
            )}
            <ComponentHeader title={title} subHeader={subtitle} />
          </div>
          {action}
        </div>

        {children}
      </div>
    </div>
  );
}
