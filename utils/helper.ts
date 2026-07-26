import { CurrencyConfig } from "@/lib/config/store";
import { convertCurrency } from "@/lib/utils";

/**
 * Currencies that use the Indian numbering system — grouped as 1,00,000 /
 * 10,00,000 / 1,00,00,000 (lakh / crore) rather than 1,000,000 (million).
 *
 * INR's own locale (en-IN) already groups this way. NPR's native locale
 * (ne-NP) also groups by lakh/crore but renders Devanagari digits (१०,००,०००),
 * so we normalize all Indian-system locales to en-IN to keep Latin digits.
 */
const INDIAN_GROUPING_LOCALES = new Set(["ne-NP", "en-IN", "hi-IN"]);

export const isIndianGroupingLocale = (locale: string): boolean =>
  INDIAN_GROUPING_LOCALES.has(locale);

/** Locale to actually format numbers with (Latin digits + lakh/crore grouping). */
const numberLocale = (locale: string): string =>
  INDIAN_GROUPING_LOCALES.has(locale) ? "en-IN" : locale;

// Format currency symbol only (no conversion)
// Uses locale-aware number formatting (Indian/Nepali: 1,00,000 | Western: 1,000,000)
export const formatCurrencySymbol = (
  amount: number,
  symbol: string,
  locale: string = "en-US",
) => {
  const isWholeNumber = amount % 1 === 0;
  const formatted = new Intl.NumberFormat(numberLocale(locale), {
    // minimumFractionDigits: isWholeNumber ? 0 :2,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formatted}`;
};

export const formatCurrencySymbolOnly = (symbol: string) => {
  return symbol;
};

// Remove this later
export const formatCurrencyChangeLater = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Currency format and conversion
export const formatCurrency = (
  amount: number,
  currency: CurrencyConfig,
  baseCurrency: string = "USD",
) => {
  const converted = convertCurrency(amount, baseCurrency, currency.code);

  return new Intl.NumberFormat(numberLocale(currency.locale), {
    style: "currency",
    currency: currency.code,
  }).format(converted);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Compact number for chart axes / tight spaces.
 *
 * Western (default): 1,000 → 1k · 1,000,000 → 1M
 * Indian (pass an NPR/INR locale): 1,00,000 → 1L · 1,00,00,000 → 1Cr
 */
export function formatCompactNumber(amount: number, locale?: string): string {
  const abs = Math.abs(amount);

  if (locale && isIndianGroupingLocale(locale)) {
    if (abs >= 1_00_00_000) {
      return `${(amount / 1_00_00_000).toFixed(amount % 1_00_00_000 === 0 ? 0 : 1)}Cr`;
    }
    if (abs >= 1_00_000) {
      return `${(amount / 1_00_000).toFixed(amount % 1_00_000 === 0 ? 0 : 1)}L`;
    }
    if (abs >= 1_000) {
      return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
    }
    return amount.toFixed(0);
  }

  if (abs >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  }
  return amount.toFixed(0);
}

export function formatDatetime(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
