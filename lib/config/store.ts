export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

export const storeConfig = {
  currency: {
    code: "NPR",
    symbol: "Rs",
    locale: "ne-NP",
  } satisfies CurrencyConfig,
};
