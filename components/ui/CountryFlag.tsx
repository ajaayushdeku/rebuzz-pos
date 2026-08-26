"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * A country flag from flagcdn's SVG, so it stays sharp at any size or pixel
 * density.
 *
 * `object-contain` (not cover) matters: Nepal is taller than it is wide and
 * Switzerland is square, so cover would crop them. The box around the image
 * absorbs the letterboxing that contain leaves on odd ratios.
 */
export default function CountryFlag({
  countryCode,
  label,
  className = "h-6 w-8",
}: {
  countryCode: string;
  /** Names the flag for assistive tech; pass "" when a nearby label repeats it. */
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center overflow-hidden`}
    >
      <img
        src={`https://flagcdn.com/${countryCode}.svg`}
        alt={label}
        loading="lazy"
        draggable={false}
        className="max-h-full max-w-full object-contain"
      />
    </span>
  );
}
