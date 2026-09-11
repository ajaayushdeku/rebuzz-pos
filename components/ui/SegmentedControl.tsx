"use client";

import type { LucideIcon } from "lucide-react";

/**
 * A row of mutually exclusive filter buttons, drawn as one control.
 *
 * The employee sections each had their own loose row of pills: the selected
 * one filled solid with the section's accent, the rest floated on their own
 * light backgrounds with a gap between. Three separate shapes read as three
 * separate controls, and a saturated fill on a small button is a lot of colour
 * for what is only a filter.
 *
 * This is the shape the rest of the app already uses for the same job — the
 * employee role filter and the shift presets both draw a grey track with a
 * raised white thumb. The accent survives as the selected label's colour,
 * so a section keeps its identity without shouting.
 *
 * These are toggle buttons, not tabs: nothing here controls a tabpanel, so
 * they carry `aria-pressed` inside a named group rather than tab semantics.
 */

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /**
   * Optional leading glyph. Decorative — the label is always present and
   * carries the meaning, so the icon is hidden from screen readers rather
   * than read out twice.
   */
  icon?: LucideIcon;
};

/**
 * Accents are looked up, never interpolated — Tailwind only ships classes it
 * can find as whole strings in the source.
 */
const ACCENTS = {
  purple: "text-purple-600",
  orange: "text-orange-600",
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  gray: "text-gray-900",
} as const;

export type SegmentAccent = keyof typeof ACCENTS;

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  accent = "gray",
  className = "",
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Names the group for screen readers, and shown as a caption when given. */
  label?: string;
  accent?: SegmentAccent;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
      )}

      <div
        role="group"
        aria-label={label}
        className="inline-flex items-center gap-0.5 rounded-lg bg-[#e4f2fe] p-1"
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
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] md:px-4 ${
                selected
                  ? `bg-white font-bold text-blue-950 shadow-sm ${ACCENTS[accent]}`
                  : "font-medium text-blue-800 hover:text-blue-950"
              }`}
            >
              {Icon && <Icon size={12} className="shrink-0" aria-hidden />}
              {option.label}
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
