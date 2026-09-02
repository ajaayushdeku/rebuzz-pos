"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ComponentHeader } from "../ComponentHeader";

/**
 * One numbered step of the builder.
 *
 * The number sits outside the card rather than inside its header, so the four
 * steps read as a single column down the page even while the cards themselves
 * are different heights.
 */
export default function OfferStepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  action,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  /** Optional icon matching the step's feature, shown beside its title. */
  icon?: LucideIcon;
  /** Background tint class for the icon badge, e.g. "bg-emerald-100". */
  iconBg?: string;
  /** Text color class for the icon itself, e.g. "text-emerald-600". */
  iconColor?: string;
  /** Optional control on the header's right, e.g. "Add custom deal". */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex items-start gap-3 sm:gap-4">
      <span className="absolute left-[-15px] mt-5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[13px] font-bold text-gray-500 sm:flex">
        {step}
      </span>

      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:px-6 md:py-4">
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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  iconBg ?? "bg-gray-100"
                }`}
              >
                <Icon size={16} className={iconColor ?? "text-gray-600"} />
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
