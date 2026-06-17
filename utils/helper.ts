import { CurrencyConfig } from "@/lib/config/store";
import { convertCurrency } from "@/lib/utils";

// Format currency symbol only (no conversion)
// Uses locale-aware number formatting (Indian/Nepali: 1,00,000 | Western: 1,000,000)
export const formatCurrencySymbol = (
  amount: number,
  symbol: string,
  locale: string = "en-US",
) => {
  const isWholeNumber = amount % 1 === 0;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
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

  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).format(converted);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export function formatDatetime(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
