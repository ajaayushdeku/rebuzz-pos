"use client";
import { createContext, useContext, useState } from "react";
import { CurrencyConfig, storeConfig } from "@/lib/config/store";

export type { CurrencyConfig } from "@/lib/config/store";

const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "NPR", symbol: "Rs", locale: "ne-NP" },
];

interface CurrencyContextValue {
  currency: CurrencyConfig;
  currencies: CurrencyConfig[];
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialCurrencyCode,
}: {
  children: React.ReactNode;
  initialCurrencyCode?: string;
}) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(
    () =>
      CURRENCIES.find((c) => c.code === initialCurrencyCode) ??
      storeConfig.currency,
  );

  const setCurrency = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrencyState(found);
      document.cookie = `currency=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
      localStorage.setItem("currency", code);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies: CURRENCIES,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
