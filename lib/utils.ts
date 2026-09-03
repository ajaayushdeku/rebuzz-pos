import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
// import { CurrencyConfig } from "./config/store";
import { EXCHANGE_RATES } from "@/lib/config/exchangeRates";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Up to two initials from a name — "Aayush Shrestha" → "AS".
 *
 * The first and *last* words rather than the first two, because a middle name
 * is the least identifying part: "Ram Bahadur Thapa" reads as RT, not RB.
 * Falls back to "?" so a blank name renders a placeholder rather than an empty
 * circle.
 */
export function initials(name?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export function getPercentColor(percent: number) {
  if (percent === 0) {
    return {
      text: "text-gray-400",
      badge: "bg-gray-100 text-gray-600",
      ArrowIcon: ArrowUpRight,
    };
  }
  return percent > 0
    ? {
        text: "text-green-400",
        badge: "bg-green-100 text-green-800",
        ArrowIcon: ArrowUpRight,
      }
    : {
        text: "text-red-400",
        badge: "bg-red-100 text-red-800",
        ArrowIcon: ArrowDownRight,
      };
}

export function getDaysColor(days: number) {
  return days >= 5
    ? {
        text: "text-red-500",
      }
    : {
        text: "text-orange-500",
      };
}

export function getDaysColorCustomers(days: number) {
  return days >= 10
    ? {
        text: "text-red-500",
      }
    : {
        text: "text-orange-500",
      };
}

const MARGIN_THRESHOLDS = [
  { min: 70, color: "text-green-700" },
  { min: 55, color: "text-orange-500" },
  { min: 20, color: "text-red-500" },
  { min: 0, color: "text-red-700" },
];

export function getMarginColors(percent: number) {
  const match = MARGIN_THRESHOLDS.find(({ min }) => percent >= min);
  return {
    text: match?.color ?? "text-green-500",
  };
}

// Currency Conversion
export const convertCurrency = (amount: number, from: string, to: string) => {
  const fromRate = EXCHANGE_RATES[from];
  const toRate = EXCHANGE_RATES[to];

  if (!fromRate || !toRate) return amount;

  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};
