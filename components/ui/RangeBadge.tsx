"use client";

import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COPY = {
  range: {
    title: "Follows the date range",
    body: "These figures update when you change the range at the top of the page. Cards without this mark use their own dates, or none at all.",
    pill: "Selected range",
  },
  month: {
    title: "Follows the month filter",
    body: "These figures update when you change the month and year at the top of the page. Cards without this mark use their own window, or none at all.",
    pill: "Selected month",
  },
} as const;

export type RangeScope = keyof typeof COPY;

const VARIANT = {
  badge:
    "ml-auto gap-1 bg-gray-50/60 px-1 sm:px-2 py-1 sm:py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800 dark:bg-[#E8ECF4] dark:text-[#c3ccdc]",
  pill: "gap-1 border border-[#dadce0] bg-white px-1 sm:px-2 py-1 sm:py-0.5 text-[11px] text-[#3c4043] hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10",
} as const;

/**
 * The explanation, attached to whatever you give it.
 *
 * Hover opens it with a pointer; on a touch screen a tap does, because there is
 * no hover to have and a mark nobody can read is decoration. Split out of
 * `RangeBadge` so a caller that wants the same answer in a different shape — a
 * sub-icon tucked under a metric, say — does not copy the touch detection and
 * then drift from it.
 *
 * The click is always stopped from travelling. Several of these sit inside a
 * card that is itself a link, and tapping the mark to read it should not open
 * the page underneath.
 */
export function RangeHint({
  scope = "range",
  className = "",
  /**
   * Whether the mark takes focus and announces itself as a button.
   *
   * Off for the ones nested inside an `<a>`: an anchor may not contain
   * interactive content, and the card already takes the focus. The tooltip is
   * supplementary there — the same note is on the card's own badge.
   */
  interactive = true,
  children,
}: {
  scope?: RangeScope;
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const copy = COPY[scope];

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

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          tabIndex={interactive ? 0 : undefined}
          role={interactive && isTouchDevice ? "button" : undefined}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isTouchDevice) {
              setOpen((current) => !current);
            }
          }}
          onKeyDown={(e) => {
            if (
              interactive &&
              isTouchDevice &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              setOpen((current) => !current);
            }
          }}
          className={`inline-flex shrink-0 cursor-help items-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
        >
          {children}
        </span>
      </TooltipTrigger>

      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 leading-relaxed opacity-80">{copy.body}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function RangeBadge({
  className = "",
  scope = "range",
  variant = "badge",
}: {
  className?: string;
  scope?: RangeScope;
  variant?: keyof typeof VARIANT;
}) {
  const copy = COPY[scope];

  return (
    <RangeHint
      scope={scope}
      className={`rounded-sm sm:rounded-full ${VARIANT[variant]} ${className}`}
    >
      <CalendarRange size={variant === "pill" ? 11 : 9} />
      <span className="truncate hidden sm:inline">
        {variant === "pill" ? copy.pill : "Range"}
      </span>
    </RangeHint>
  );
}
