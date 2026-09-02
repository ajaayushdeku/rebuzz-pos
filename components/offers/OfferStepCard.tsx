"use client";

import type { ReactNode } from "react";
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
  action,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  /** Optional control on the header's right, e.g. "Add custom deal". */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="mt-5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[13px] font-bold text-gray-500 sm:flex">
        {step}
      </span>

      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
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

          <ComponentHeader title={title} subHeader={subtitle} />
          {action}
        </div>

        {children}
      </div>
    </div>
  );
}
