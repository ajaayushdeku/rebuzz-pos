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

const VARIANT = {
  badge:
    "ml-auto gap-1 bg-gray-50/60 px-1 sm:px-2 py-1 sm:py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800 dark:bg-[#E8ECF4] dark:text-[#c3ccdc]",
  pill: "gap-1 border border-[#dadce0] bg-white px-1 sm:px-2 py-1 sm:py-0.5 text-[11px] text-[#3c4043] hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10",
} as const;

export default function RangeBadge({
  className = "",
  scope = "range",
  variant = "badge",
}: {
  className?: string;
  scope?: keyof typeof COPY;
  variant?: keyof typeof VARIANT;
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
          tabIndex={0}
          role={isTouchDevice ? "button" : undefined}
          onClick={() => {
            if (isTouchDevice) {
              setOpen((current) => !current);
            }
          }}
          onKeyDown={(e) => {
            if (isTouchDevice && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setOpen((current) => !current);
            }
          }}
          className={`inline-flex shrink-0 cursor-help items-center rounded-sm sm:rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${VARIANT[variant]} ${className}`}
        >
          <CalendarRange size={variant === "pill" ? 11 : 9} />
          <span className="truncate hidden sm:inline">
            {variant === "pill" ? copy.pill : "Range"}
          </span>
        </span>
      </TooltipTrigger>

      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 leading-relaxed opacity-80">{copy.body}</p>
      </TooltipContent>
    </Tooltip>
  );
}
