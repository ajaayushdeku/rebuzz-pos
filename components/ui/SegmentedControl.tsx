"use client";

import type { LucideIcon } from "lucide-react";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

const ACCENTS = {
  purple: "text-purple-600 dark:text-purple-300",
  orange: "text-orange-600 dark:text-orange-300",
  blue: "text-blue-600 dark:text-[#a8c4ee]",
  emerald: "text-emerald-600 dark:text-emerald-300",
  gray: "text-gray-900 dark:text-[#e8ecf4]",
} as const;

export type SegmentAccent = keyof typeof ACCENTS;

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  accent = "gray",
  className = "",
  iconSize = 12,
  showText = false,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label?: string;
  accent?: SegmentAccent;
  className?: string;
  iconSize?: number;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium text-gray-400 dark:text-[#7b869b]">
          {label}
        </span>
      )}

      <div
        role="group"
        aria-label={label}
        className="inline-flex items-center gap-0.5 rounded-lg bg-[#e4f2fe] p-1 dark:bg-white/10"
      >
        {options.map((option) => {
          const selected = option.value === value;
          // Bound to a capitalised name so JSX reads it as a component.
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] md:px-4 dark:focus-visible:ring-offset-[#242a38] ${
                selected
                  ? `bg-white font-bold text-blue-950 shadow-sm dark:bg-white/15 dark:shadow-none ${ACCENTS[accent]}`
                  : "font-medium text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white"
              }`}
            >
              {Icon && (
                <Icon size={iconSize} className="shrink-0" aria-hidden />
              )}
              <span className={showText ? "py-0 " : "truncate hidden sm:block"}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Turns a bare `["all", "paid"]` list into labelled options. */
export function toSegmentOptions<T extends string>(
  values: readonly T[],
  icons: Partial<Record<T, LucideIcon>> = {},
): SegmentOption<T>[] {
  return values.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    icon: icons[value],
  }));
}
