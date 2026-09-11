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

/**
 * Formats the numeric part of a compact value (e.g. the "1.5" in "1.5Cr")
 * so it stays short even for astronomically large amounts. Values with an
 * integer part of 1,000,000+ fall back to exponential notation.
 */
const formatCompactValue = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return value.toExponential(1).replace(/\.0e/, "e");
  }
  return value.toFixed(1).replace(/\.0$/, "");
};

/**
 * Puts a minus in front of the currency symbol rather than after it.
 *
 * Formatting the signed number and then prefixing the symbol produced
 * "Rs -1,200.00", which reads as a symbol applied to nothing and is not how
 * any locale writes a negative amount. The sign has to lead the whole thing.
 *
 * Takes the already-formatted string so it can be applied wherever a symbol is
 * glued to a number, and reads the sign from the original value so an amount
 * that rounds away to zero is not printed as a negative nothing.
 */
const withSign = (amount: number, formatted: string) =>
  amount < 0 && /[1-9]/.test(formatted) ? `-${formatted}` : formatted;

/**
 * Symbol plus a compact number, for chart axes and other tight spaces.
 *
 * The pairing chart code used to write out by hand, which put the minus in the
 * wrong place on any axis that runs below zero.
 */
export const formatCompactCurrency = (
  amount: number,
  symbol: string,
  locale?: string,
) =>
  withSign(
    amount,
    `${symbol} ${formatCompactNumber(Math.abs(amount), locale)}`,
  );

// Format currency symbol only (no conversion)
// Uses locale-aware number formatting (Indian/Nepali: 1,00,000 | Western: 1,000,000)
// Very large values (≥ 1,00,00,000 Indian / ≥ 1,000,000 Western) are compacted
// (e.g. 1Cr / 1M) so they fit comfortably in the UI.
export const formatCurrencySymbol = (
  amount: number,
  symbol: string,
  locale: string = "en-US",
) => {
  const abs = Math.abs(amount);
  const isIndian = isIndianGroupingLocale(locale);
  const threshold = isIndian ? 1_00_00_00_000 : 1_000_000_000;

  // Very large values — use compact notation so they fit in the UI
  if (abs >= threshold) {
    return withSign(amount, `${symbol} ${formatCompactNumber(abs, locale)}`);
  }

  const formatted = new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return withSign(amount, `${symbol} ${formatted}`);
};

/* Formats an amount with locale-aware grouping */
export const formatAmount = (
  amount: number,
  locale: string = "en-US",
): string => {
  const abs = Math.abs(amount);
  const isIndian = isIndianGroupingLocale(locale);
  const threshold = isIndian ? 1_00_00_00_000 : 1_000_000_000;

  // Very large values — use compact notation so they fit in the UI
  if (abs >= threshold) {
    return formatCompactNumber(amount, locale);
  }

  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * A plain number: no decimal part on a whole number, two places on anything
 * else.
 *
 *   120      120
 *   120.5    120.50
 *   12.345   12.35
 *
 * A whole number is free of a pointless ".00" — counts of things, which is
 * most of what this formats, read worse with one. A value that does have a
 * fraction gets both places, so a column of them lines up on the point
 * instead of jittering between one digit and two.
 *
 * The cap used to be zero, which meant every fraction was rounded away: a
 * growth figure of 12.5% printed as 13%. Anything needing a fixed two places
 * whether or not there is a fraction is `formatAmount`.
 */
export const formatNumber = (
  amount: number,
  locale: string = "en-US",
): string => {
  const abs = Math.abs(amount);
  const isIndian = isIndianGroupingLocale(locale);
  const threshold = isIndian ? 1_00_00_00_000 : 1_000_000_000;

  // Very large values — use compact notation so they fit in the UI
  if (abs >= threshold) {
    return formatCompactNumber(amount, locale);
  }

  // Read off the value itself, not the rounded output, so 12.001 is treated
  // as the fractional number it is and prints "12.00" rather than a bare "12".
  const hasFraction = amount % 1 !== 0;

  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
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
  baseCurrency: string = "NPR",
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
 *
 * Units are capped at 1,00,00,000 (1Cr) for Indian locales and 1,000,000 (1M)
 * for Western locales. Values beyond that still use those units, but the
 * numeric part falls back to exponential notation (e.g. 1e+17Cr) so the
 * string never becomes unwieldy.
 */
export function formatCompactNumber(amount: number, locale?: string): string {
  const abs = Math.abs(amount);

  if (locale && isIndianGroupingLocale(locale)) {
    if (abs >= 1_00_00_000) {
      return `${formatCompactValue(amount / 1_00_00_000)}Cr`;
    }
    if (abs >= 1_00_000) {
      return `${formatCompactValue(amount / 1_00_000)}L`;
    }
    if (abs >= 1_000) {
      return `${formatCompactValue(amount / 1_000)}k`;
    }
    return amount.toFixed(0);
  }

  if (abs >= 1_000_000) {
    return `${formatCompactValue(amount / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${formatCompactValue(amount / 1_000)}k`;
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

/**
 * Render a product with its variant as `Coke [Medium/Cherry]`.
 *
 * Option values arrive in several spellings — the item picker joins them with
 * " · " while the payload builder rewrites them to "/" — so every separator is
 * flattened to a single "/" and each value is capitalised. Returns the bare
 * product name when there is no variant.
 */
export const formatVariantName = (
  productName: string,
  optionValues?: string | string[] | null,
): string => {
  // A stored name often already carries its variant as "Coke (medium · cherry)"
  // — that is how the item picker writes it, and paid bills do not always send
  // a separate `variantItems`. Peel any trailing "(…)"/"[…]" off so the bracket
  // form is produced from one place whichever shape arrived, and so an explicit
  // label never gets appended on top of one already in the name.
  let base = productName.trim();
  let values = optionValues;

  const trailing = base.match(/^(.*\S)\s*[([]([^()[\]]+)[)\]]$/);
  if (trailing) {
    base = trailing[1].trim();
    const explicit = Array.isArray(values)
      ? values.filter(Boolean).length > 0
      : !!values?.trim();
    if (!explicit) values = trailing[2];
  }

  const parts = (Array.isArray(values) ? values : (values ?? "").split(/[/·,]/))
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1));

  return parts.length ? `${base} [${parts.join("/")}]` : base;
};

/**
 * A date range as one label, with the year said only where it is needed.
 *
 *   same day        Aug 12, 2026
 *   same year       Aug 12 – Sep 10, 2026
 *   across years    Aug 12, 2025 – Sep 10, 2026
 *
 * Repeating the year on both ends of a within-year range is the longest form
 * of the least useful information, and it was overflowing the filter button.
 * Dropping it unconditionally is worse: a range that genuinely crosses a new
 * year then reads as though both ends sit in the later one.
 */
export const formatDateRangeLabel = (
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  fallback = "Select date",
): string => {
  const parse = (value: Date | string | null | undefined): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    // A bare "YYYY-MM-DD" is read as UTC midnight by the Date constructor,
    // which renders the day before in any negative offset. Build it from the
    // parts instead so the label always names the day that was picked.
    const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const parsed = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const from = parse(start);
  const to = parse(end);

  if (!from && !to) return fallback;
  if (!from || !to) {
    const only = (from ?? to) as Date;
    return only.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const [a, b] = from <= to ? [from, to] : [to, from];

  const withYear = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const withoutYear = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (a.getTime() === b.getTime()) return withYear(a);

  return a.getFullYear() === b.getFullYear()
    ? `${withoutYear(a)} – ${withYear(b)}`
    : `${withYear(a)} – ${withYear(b)}`;
};
