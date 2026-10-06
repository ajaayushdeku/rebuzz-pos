"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const VARIANT = {
  badge:
    "ml-auto gap-1 bg-rose-50/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800 dark:bg-rose-400/10 dark:text-rose-200",
  pill:
    "gap-1 border border-rose-200 bg-white px-2 py-0.5 text-[11px] text-rose-800 hover:bg-rose-50/60 " +
    "dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15",
} as const;

export default function ExpenseBadge({
  className = "",
  variant = "badge",
}: {
  className?: string;
  variant?: keyof typeof VARIANT;
}) {
  const [open, setOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const update = () => {
      setIsTouchDevice(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  const toggleTooltip = () => {
    if (isTouchDevice) {
      setOpen((current) => !current);
    }
  };

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role={isTouchDevice ? "button" : undefined}
          onClick={toggleTooltip}
          onKeyDown={(e) => {
            if (isTouchDevice && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              toggleTooltip();
            }
          }}
          className={`inline-flex shrink-0 cursor-help items-center rounded-sm sm:rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${VARIANT[variant]} ${className}`}
        >
          <ReceiptText size={11} />
          {variant === "pill" ? "Uses expenses" : "Expenses"}
        </span>
      </TooltipTrigger>

      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">Uses your expense entries</p>

        <p className="mt-1 leading-relaxed opacity-80">
          These figures include costs recorded in the expense tracker as well as
          miscellaneous income, so they are only as complete as what has been
          entered for the period.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
