export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

export const storeConfig = {
  currency: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
  } satisfies CurrencyConfig,
};
