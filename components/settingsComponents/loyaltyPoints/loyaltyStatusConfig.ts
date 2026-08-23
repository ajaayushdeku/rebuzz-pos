import { Trophy, Diamond, Gem, Medal, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LoyaltyStatus {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  bgColor: string;
}

/** Palette for the tiers the app knows by name. */
export const STATUS_COLORS: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  diamond: {
    color: "text-cyan-700",
    bg: "bg-cyan-100 border-cyan-200",
    label: "Diamond",
  },
  gold: {
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
    label: "Gold",
  },
  silver: {
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
    label: "Silver",
  },
  bronze: {
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
    label: "Bronze",
  },
  platinum: {
    color: "text-indigo-700",
    bg: "bg-indigo-100 border-indigo-200",
    label: "Platinum",
  },
};

/** Order colours are handed out to newly created tiers. */
export const COLOR_KEYS = ["bronze", "silver", "gold", "diamond", "platinum"];

export const FALLBACK_TIER_STYLE = {
  color: "text-blue-700",
  bg: "bg-blue-100",
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

/** "0 – 499" for a tier with a successor, "5,000+" for the top one. */
export function pointRange(
  status: LoyaltyStatus,
  next: LoyaltyStatus | undefined,
): string {
  return next
    ? `${status.minPoints.toLocaleString()} – ${(next.minPoints - 1).toLocaleString()}`
    : `${status.minPoints.toLocaleString()}+`;
}
