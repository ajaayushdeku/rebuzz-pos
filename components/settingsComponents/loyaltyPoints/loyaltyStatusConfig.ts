import { Trophy, Diamond, Gem, Medal, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LoyaltyStatus {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  bgColor: string;
}

/** One swatch a tier can be painted with. */
export interface TierSwatch {
  /** The Tailwind hue, and the key the assignment pool tracks. */
  key: string;
  color: string;
  bg: string;
}

/**
 * The tiers the app knows by name, painted the way their names read.
 *
 * Gold is the gold swatch wherever it sits in a ladder — these five are fixed
 * so a business that uses the classic names gets the classic colours.
 */
export const STATUS_COLORS: Record<string, TierSwatch> = {
  bronze: {
    key: "orange",
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
  },
  silver: {
    key: "gray",
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
  },
  gold: {
    key: "yellow",
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
  },
  diamond: {
    key: "cyan",
    color: "text-cyan-700",
    bg: "bg-cyan-100 border-cyan-200",
  },
  platinum: {
    key: "indigo",
    color: "text-indigo-700",
    bg: "bg-indigo-100 border-indigo-200",
  },
};

/**
 * Every swatch a tier can be given, in the order they are handed out.
 *
 * Twenty of them, because a ladder is not limited to five rungs and five
 * colours meant the sixth tier onwards all came out the same shade. The named
 * five lead, so a business using the classic names still gets them; the rest
 * are ordered to hop around the colour wheel rather than walk it, which keeps
 * neighbouring tiers in the table visibly apart.
 *
 * Written as whole class strings on purpose — Tailwind scans source text for
 * class names, so a hue interpolated into `text-${hue}-700` would compile to
 * nothing.
 */
export const TIER_PALETTE: TierSwatch[] = [
  ...Object.values(STATUS_COLORS),
  { key: "rose", color: "text-rose-700", bg: "bg-rose-100 border-rose-200" },
  {
    key: "emerald",
    color: "text-emerald-700",
    bg: "bg-emerald-100 border-emerald-200",
  },
  {
    key: "violet",
    color: "text-violet-700",
    bg: "bg-violet-100 border-violet-200",
  },
  {
    key: "amber",
    color: "text-amber-700",
    bg: "bg-amber-100 border-amber-200",
  },
  { key: "sky", color: "text-sky-700", bg: "bg-sky-100 border-sky-200" },
  {
    key: "fuchsia",
    color: "text-fuchsia-700",
    bg: "bg-fuchsia-100 border-fuchsia-200",
  },
  { key: "lime", color: "text-lime-700", bg: "bg-lime-100 border-lime-200" },
  { key: "blue", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
  { key: "red", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  { key: "teal", color: "text-teal-700", bg: "bg-teal-100 border-teal-200" },
  {
    key: "purple",
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-200",
  },
  {
    key: "green",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
  },
  { key: "pink", color: "text-pink-700", bg: "bg-pink-100 border-pink-200" },
  {
    key: "slate",
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200",
  },
  {
    key: "stone",
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
  },
];

/**
 * For a ladder longer than the palette.
 *
 * Deliberately zinc — the one Tailwind hue the palette leaves out — so the
 * overflow colour can never be mistaken for a swatch that was actually
 * assigned to some other tier.
 */
export const FALLBACK_TIER_STYLE = {
  color: "text-zinc-700",
  bg: "bg-zinc-100 border-zinc-200",
};

/**
 * Every tier used to render a Diamond, so Bronze and Diamond were the same
 * glyph. Named tiers get something that reads like their rank; anything the
 * business invents falls back to a generic badge.
 */
const TIER_ICONS: Record<string, LucideIcon> = {
  bronze: Medal,
  silver: Medal,
  gold: Trophy,
  platinum: Gem,
  diamond: Diamond,
};

export function tierIcon(name: string): LucideIcon {
  return TIER_ICONS[name.trim().toLowerCase()] ?? Award;
}

/**
 * Tiers are a ladder, so they read in threshold order regardless of the order
 * they were added — which is also what makes each row's point range derivable
 * from the next row's minimum.
 */
export function sortByThreshold(statuses: LoyaltyStatus[]): LoyaltyStatus[] {
  return [...statuses].sort((a, b) => a.minPoints - b.minPoints);
}

/**
 * The tier a point total falls into.
 *
 * The highest tier the customer has reached — the ladder is a set of floors,
 * so the answer is the last one they are at or above. Returns undefined when
 * the business has no tiers, or when its lowest floor is above this customer,
 * which is a real state: a ladder starting at 300 says nothing about someone
 * on 40.
 */
export function tierForPoints(
  points: number,
  tiers: LoyaltyStatus[],
): LoyaltyStatus | undefined {
  return sortByThreshold(tiers).reduce<LoyaltyStatus | undefined>(
    (reached, tier) => (points >= tier.minPoints ? tier : reached),
    undefined,
  );
}

/** "0 – 499" for a tier with a successor, "5,000+" for the top one. */
export function pointRange(
  status: LoyaltyStatus,
  next: LoyaltyStatus | undefined,
): string {
  return next
    ? `${status.minPoints.toLocaleString()} – ${(next.minPoints - 1).toLocaleString()}`
    : `${status.minPoints.toLocaleString()}+`;
}
