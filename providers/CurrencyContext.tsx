"use client";
import { createContext, useContext, useState } from "react";
import { CurrencyConfig, storeConfig } from "@/lib/config/store";
import { CURRENCY_OPTIONS } from "@/lib/config/currencies";
import { updateCurrency } from "@/services/apiCurrency.client";

export type { CurrencyConfig } from "@/lib/config/store";

/**
 * Every currency the picker offers.
 *
 * Shared with the settings page: a code listed there but missing here would be
 * silently ignored by `setCurrency`, which looks the code up before saving.
 */
const CURRENCIES: CurrencyConfig[] = CURRENCY_OPTIONS;

interface CurrencyContextValue {
  currency: CurrencyConfig;
  currencies: CurrencyConfig[];
  /**
   * Saves the choice to the business, then keeps it locally.
   *
   * Rejects when the save fails, so a caller can tell the user rather than
   * showing a currency the server never accepted.
   */
  setCurrency: (code: string) => Promise<void>;
  /** True while a save is in flight. */
  isSaving: boolean;
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
  const [isSaving, setIsSaving] = useState(false);

  /**
   * The cookie is what the server layout reads on the next request, so the
   * choice survives a reload without waiting on the API. It is a cache of the
   * saved value, not the record of it.
   */
  const cacheLocally = (code: string) => {
    document.cookie = `currency=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    localStorage.setItem("currency", code);
  };

  const setCurrency = async (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (!found || found.code === currency.code) return;

    // Switch first so the UI responds at once, and put it back if the save
    // fails — otherwise the app would show a currency the business is not on.
    const previous = currency;
    setCurrencyState(found);
    cacheLocally(found.code);
    setIsSaving(true);

    try {
      // The API stores the symbol, not the code.
      await updateCurrency(found.symbol);
    } catch (err) {
      setCurrencyState(previous);
      cacheLocally(previous.code);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies: CURRENCIES,
        setCurrency,
        isSaving,
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
