"use client";

import { useId, useState } from "react";
import { Check, Printer } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRINTER_FEATURE, type Plan } from "@/lib/config/plans";

/**
 * One plan.
 *
 * Hiding below `md` is done in CSS rather than by rendering conditionally, so
 * the three cards are always in the DOM: a resize then has nothing to mount,
 * and neither the tab state nor a printer toggle has to survive a remount.
 *
 * The highlight is `md:` only. On a narrow screen the selected card is the
 * only one shown, so ringing it would be marking the obvious.
 */
export default function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onChoose,
}: {
  plan: Plan;
  isSelected: boolean;
  /** The plan the business is on today; its button is inert. */
  isCurrent: boolean;
  onChoose: (plan: Plan, withPrinter: boolean) => void;
}) {
  const printerLabelId = useId();
  const [withPrinter, setWithPrinter] = useState(false);

  // The toggle only means anything on a plan that offers the bundle, so a
  // stale `true` on a plan without one can never leak into the feature list.
  const addon = plan.printerAddon;
  const printerOn = Boolean(addon) && withPrinter;

  const features = printerOn
    ? [...plan.features, PRINTER_FEATURE]
    : plan.features;

  return (
    <div
      className={cn(
        "flex-col rounded-2xl border bg-white p-5 transition-shadow md:flex",
        isSelected ? "flex" : "hidden",
        isSelected
          ? "border-blue-500 shadow-md md:ring-2 md:ring-blue-500/30"
          : "border-gray-200 md:hover:shadow-sm",
      )}
    >
      <div className="relative mb-4">
        {plan.badge ? (
          <span className="mb-2 absolute right-0 inline-block rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
            {plan.badge}
          </span>
        ) : null}

        <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{plan.tagline}</p>
      </div>

      {/* Price. The old figure is set at the same size as the period beside
          it, so the discount reads as a footnote to the price rather than
          competing with it. `items-baseline` keeps all three sitting on one
          line however much they differ in size. */}
      <div className="mb-5 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>

        {plan.discount ? (
          <span className="text-sm text-gray-400 line-through">
            {plan.discount.originalPrice}
          </span>
        ) : null}

        <span className="text-xs text-gray-400">{plan.period}</span>

        {plan.discount ? (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Save {plan.discount.saving}
          </span>
        ) : null}
      </div>

      {/* Printer bundle — shown only on the plan whose tab is selected, so the
          toggle never appears twice (once for Yearly and again for Lifetime).
          It sits directly under the list, so switching it on adds its line
          immediately above the toggle that added it. */}
      {addon && isSelected ? (
        <div
          className={cn(
            "mb-4 py-2 transition-colors",
            // printerOn
            //   ? "border-blue-200 bg-blue-50/70"
            //   : "border-gray-200 bg-gray-50/70",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Printer
                size={14}
                aria-hidden
                className={printerOn ? "text-blue-600" : "text-gray-400"}
              />
              <span
                id={printerLabelId}
                className="text-[13px] font-semibold text-gray-800"
              >
                Printer service
              </span>
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={printerOn}
              aria-labelledby={printerLabelId}
              onClick={() => setWithPrinter((on) => !on)}
              className={cn(
                "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                printerOn ? "bg-blue-600" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                  printerOn ? "translate-x-[0px]" : "translate-x-[-17px]",
                )}
              />
            </button>
          </div>

          {/* Shown whether or not the toggle is on: the cost is what decides
              whether to switch it on in the first place. */}
          <p
            className={cn(
              "mt-1.5 text-xs transition-colors",
              printerOn ? "font-semibold text-blue-700" : "text-gray-500",
            )}
          >
            + {addon.price}{" "}
            <span className="font-normal text-gray-400">({addon.note})</span>
          </p>
        </div>
      ) : null}

      <span className="text-md font-semibold text-gray-900 mb-2">
        What&lsquo;s included
      </span>

      {/* flex-1 pushes everything below to the bottom, so the buttons line up
          across the row even when the feature lists differ in length. */}
      <ul className="mb-4 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              size={14}
              className={cn(
                "mt-0.5 shrink-0",
                feature === PRINTER_FEATURE
                  ? "text-green-600"
                  : "text-blue-600",
              )}
              aria-hidden
            />
            <span className="text-[13px] leading-snug text-gray-600">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onChoose(plan, printerOn)}
        disabled={isCurrent}
        className={cn(
          "w-full rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors",
          isCurrent
            ? "cursor-default border border-gray-200 bg-gray-50 text-gray-400"
            : "cursor-pointer bg-blue-600 text-white hover:bg-blue-700",
        )}
      >
        {isCurrent ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}
