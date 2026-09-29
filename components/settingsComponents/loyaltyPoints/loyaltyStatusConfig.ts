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

/**
 * The dark half of every swatch below, keyed by its light class.
 *
 * Written out rather than derived. A tier's colours are stored per business as
 * these Tailwind strings, so a business configured before dark mode existed
 * has only the light half on record — but a hue interpolated into
 * `dark:text-${hue}-300` would never reach the stylesheet, for the same reason
 * the swatches themselves are written out in full.
 */
const TIER_DARK: Record<string, string> = {
  "text-orange-700": "dark:text-orange-300",
  "bg-orange-100": "dark:bg-orange-400/15",
  "border-orange-200": "dark:border-orange-400/25",
  "text-gray-700": "dark:text-[#c3ccdc]",
  "text-gray-600": "dark:text-[#c3ccdc]",
  "bg-gray-100": "dark:bg-white/10",
  "border-gray-200": "dark:border-white/15",
  "text-yellow-700": "dark:text-yellow-300",
  "bg-yellow-100": "dark:bg-yellow-400/15",
  "border-yellow-200": "dark:border-yellow-400/25",
  "text-cyan-700": "dark:text-cyan-300",
  "bg-cyan-100": "dark:bg-cyan-400/15",
  "border-cyan-200": "dark:border-cyan-400/25",
  "text-indigo-700": "dark:text-indigo-300",
  "bg-indigo-100": "dark:bg-indigo-400/15",
  "border-indigo-200": "dark:border-indigo-400/25",
  "text-rose-700": "dark:text-rose-300",
  "bg-rose-100": "dark:bg-rose-400/15",
  "border-rose-200": "dark:border-rose-400/25",
  "text-emerald-700": "dark:text-emerald-300",
  "bg-emerald-100": "dark:bg-emerald-400/15",
  "border-emerald-200": "dark:border-emerald-400/25",
  "text-violet-700": "dark:text-violet-300",
  "bg-violet-100": "dark:bg-violet-400/15",
  "border-violet-200": "dark:border-violet-400/25",
  "text-amber-700": "dark:text-amber-300",
  "bg-amber-100": "dark:bg-amber-400/15",
  "border-amber-200": "dark:border-amber-400/25",
  "text-sky-700": "dark:text-sky-300",
  "bg-sky-100": "dark:bg-sky-400/15",
  "border-sky-200": "dark:border-sky-400/25",
  "text-fuchsia-700": "dark:text-fuchsia-300",
  "bg-fuchsia-100": "dark:bg-fuchsia-400/15",
  "border-fuchsia-200": "dark:border-fuchsia-400/25",
  "text-lime-700": "dark:text-lime-300",
  "bg-lime-100": "dark:bg-lime-400/15",
  "border-lime-200": "dark:border-lime-400/25",
  "text-blue-700": "dark:text-blue-300",
  "bg-blue-100": "dark:bg-blue-400/15",
  "border-blue-200": "dark:border-blue-400/25",
  "text-red-700": "dark:text-red-300",
  "bg-red-100": "dark:bg-red-400/15",
  "border-red-200": "dark:border-red-400/25",
  "text-teal-700": "dark:text-teal-300",
  "bg-teal-100": "dark:bg-teal-400/15",
  "border-teal-200": "dark:border-teal-400/25",
  "text-purple-700": "dark:text-purple-300",
  "bg-purple-100": "dark:bg-purple-400/15",
  "border-purple-200": "dark:border-purple-400/25",
  "text-green-700": "dark:text-green-300",
  "bg-green-100": "dark:bg-green-400/15",
  "border-green-200": "dark:border-green-400/25",
  "text-pink-700": "dark:text-pink-300",
  "bg-pink-100": "dark:bg-pink-400/15",
  "border-pink-200": "dark:border-pink-400/25",
  "text-slate-700": "dark:text-[#c3ccdc]",
  "text-slate-600": "dark:text-[#c3ccdc]",
  "bg-slate-100": "dark:bg-white/10",
  "border-slate-200": "dark:border-white/15",
  "text-stone-700": "dark:text-[#c3ccdc]",
  "text-stone-600": "dark:text-[#c3ccdc]",
  "bg-stone-100": "dark:bg-white/10",
  "border-stone-200": "dark:border-white/15",
};

/**
 * Add the dark-mode half of a tier's swatch, whatever it was stored as.
 *
 * Idempotent: a swatch that already carries its dark half passes through, and
 * a class the table does not know is left exactly as it is.
 */
export function withTierDark(classes: string): string {
  if (!classes || classes.includes("dark:")) return classes;
  return classes
    .split(/\s+/)
    .map((token) => {
      const dark = TIER_DARK[token];
      return dark ? `${token} ${dark}` : token;
    })
    .join(" ");
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
