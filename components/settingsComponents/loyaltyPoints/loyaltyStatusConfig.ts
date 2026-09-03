import { useCurrency } from "@/providers/CurrencyContext";
import { formatNumber } from "@/utils/helper";
import { Trophy, Diamond, Gem, Medal, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LoyaltyStatus {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  bgColor: string;
  /** The swatch's hue as a literal colour, for charts. */
  hex: string;
}

/** One swatch a tier can be painted with. */
export interface TierSwatch {
  /** The Tailwind hue, and the key the assignment pool tracks. */
  key: string;
  color: string;
  bg: string;
  /**
   * The same hue as a literal colour, for canvas and SVG.
   *
   * Recharts paints with `fill`, not with classes, so a chart cannot use the
   * Tailwind strings above. Carrying both here keeps a tier's bar and its
   * badge the same colour by construction.
   */
  hex: string;
}

/**
 * The tiers the app knows by name, painted the way their names read.
 *
 * Silver's and gold's hexes are pulled a few steps off the literal metal
 * (#cdcdcd, #f7dd46), which was too pale to read as a filled bar on a white
 * card while keeping the association.
 *
 * Gold is the gold swatch wherever it sits in a ladder — these five are fixed
 * so a business that uses the classic names gets the classic colours.
 */
export const STATUS_COLORS: Record<string, TierSwatch> = {
  bronze: {
    key: "orange",
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
    hex: "#d97706",
  },
  silver: {
    key: "gray",
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
    hex: "#94a3b8",
  },
  gold: {
    key: "yellow",
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
    hex: "#eab308",
  },
  diamond: {
    key: "cyan",
    color: "text-cyan-700",
    bg: "bg-cyan-100 border-cyan-200",
    hex: "#06b6d4",
  },
  platinum: {
    key: "indigo",
    color: "text-indigo-700",
    bg: "bg-indigo-100 border-indigo-200",
    hex: "#6366f1",
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
  {
    key: "rose",
    color: "text-rose-700",
    bg: "bg-rose-100 border-rose-200",
    hex: "#f43f5e",
  },
  {
    key: "emerald",
    color: "text-emerald-700",
    bg: "bg-emerald-100 border-emerald-200",
    hex: "#10b981",
  },
  {
    key: "violet",
    color: "text-violet-700",
    bg: "bg-violet-100 border-violet-200",
    hex: "#8b5cf6",
  },
  {
    key: "amber",
    color: "text-amber-700",
    bg: "bg-amber-100 border-amber-200",
    hex: "#f59e0b",
  },
  {
    key: "sky",
    color: "text-sky-700",
    bg: "bg-sky-100 border-sky-200",
    hex: "#0ea5e9",
  },
  {
    key: "fuchsia",
    color: "text-fuchsia-700",
    bg: "bg-fuchsia-100 border-fuchsia-200",
    hex: "#d946ef",
  },
  {
    key: "lime",
    color: "text-lime-700",
    bg: "bg-lime-100 border-lime-200",
    hex: "#84cc16",
  },
  {
    key: "blue",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
    hex: "#3b82f6",
  },
  {
    key: "red",
    color: "text-red-700",
    bg: "bg-red-100 border-red-200",
    hex: "#ef4444",
  },
  {
    key: "teal",
    color: "text-teal-700",
    bg: "bg-teal-100 border-teal-200",
    hex: "#14b8a6",
  },
  {
    key: "purple",
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-200",
    hex: "#a855f7",
  },
  {
    key: "green",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
    hex: "#22c55e",
  },
  {
    key: "pink",
    color: "text-pink-700",
    bg: "bg-pink-100 border-pink-200",
    hex: "#ec4899",
  },
  {
    key: "slate",
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200",
    hex: "#64748b",
  },
  {
    key: "stone",
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
    hex: "#78716c",
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
  hex: "#71717a",
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
  // This utility is called from the component rendering the range.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { currency } = useCurrency();
  return next
    ? `${formatNumber(status.minPoints, currency.locale)} – ${formatNumber(next.minPoints - 1, currency.locale)}`
    : `${formatNumber(status.minPoints, currency.locale)}+`;
}
