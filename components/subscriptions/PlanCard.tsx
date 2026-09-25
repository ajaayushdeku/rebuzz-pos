"use client";

import { useId, useState } from "react";
import {
  Check,
  Crown,
  Gem,
  Leaf,
  Printer,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PRINTER_FEATURE, type Plan, type PlanId } from "@/lib/config/plans";

const PLAN_ICONS: Record<PlanId, LucideIcon> = {
  free: Leaf,
  yearly: Gem,
  lifetime: Crown,
};

export default function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onChoose,
}: {
  plan: Plan;
  isSelected: boolean;
  isCurrent: boolean;
  onChoose: (plan: Plan, withPrinter: boolean) => void;
}) {
  const printerLabelId = useId();
  const [withPrinter, setWithPrinter] = useState(false);

  const addon = plan.printerAddon;
  const printerOn = Boolean(addon) && withPrinter;

  const features = printerOn
    ? [...plan.features, PRINTER_FEATURE]
    : plan.features;

  const PlanIcon = PLAN_ICONS[plan.id] ?? Gem;

  return (
    <div
      className={cn(
        "flex-col rounded-2xl border bg-white p-5 transition-colors md:flex",
        isSelected ? "flex" : "hidden",
        isSelected
          ? "border-blue-500 md:ring-2 md:ring-blue-500/30"
          : "border-[#e3e3e3] md:hover:border-[#dadce0]",
      )}
    >
      <div className="relative mb-4">
        {plan.badge ? (
          <span className="absolute right-0 mb-2 inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            {plan.badge}
          </span>
        ) : null}

        <div className="flex items-center gap-3 ">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-blue-50 text-blue-600">
            <PlanIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 ">
            <h2 className="truncate text-lg font-semibold tracking-tight text-[#3c4043]">
              {plan.name}
            </h2>
            <p className="mt-0.5 w-full text-xs text-[#9aa0a6]">
              {plan.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
        <span className="text-[28px] font-semibold tracking-tight tabular-nums text-[#3c4043]">
          {plan.price}
        </span>

        {plan.discount ? (
          <span className="text-sm text-[#9aa0a6] line-through">
            {plan.discount.originalPrice}
          </span>
        ) : null}

        <span className="text-xs text-[#9aa0a6]">{plan.period}</span>

        {plan.discount ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Save {plan.discount.saving}
          </span>
        ) : null}
      </div>

      {addon && isSelected ? (
        <div className="mb-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Printer
                size={14}
                aria-hidden
                className={printerOn ? "text-blue-600" : "text-[#9aa0a6]"}
              />
              <span
                id={printerLabelId}
                className="text-[13px] font-medium text-[#3c4043]"
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
                printerOn ? "bg-blue-600" : "bg-[#dadce0]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                  printerOn ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Shown whether or not the toggle is on: the cost is what decides
              whether to switch it on in the first place. */}
          <p
            className={cn(
              "mt-1.5 text-xs transition-colors",
              printerOn ? "font-semibold text-blue-700" : "text-[#5f6368]",
            )}
          >
            + {addon.price}{" "}
            <span className="font-normal text-[#9aa0a6]">({addon.note})</span>
          </p>
        </div>
      ) : null}

      <span className="mb-2 text-[13px] font-semibold text-[#3c4043]">
        What&lsquo;s included
      </span>

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
            <span className="text-[13px] leading-snug text-[#5f6368]">
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
            ? "cursor-default border border-[#dadce0] bg-[#f8f9fa] text-[#9aa0a6]"
            : "cursor-pointer bg-blue-600 text-white hover:bg-blue-700",
        )}
      >
        {isCurrent ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}
