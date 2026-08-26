"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CurrencyConfig, storeConfig } from "@/lib/config/store";
import {
  CURRENCY_OPTIONS,
  findCurrencyBySymbol,
} from "@/lib/config/currencies";
import {
  fetchSavedCurrencySymbol,
  updateCurrency,
} from "@/services/apiCurrency.client";

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

  /**
   * The code currently in play, for the symbol lookup below.
   *
   * Held in a ref so the seeding effect can read it without listing `currency`
   * as a dependency — that would re-run the fetch on every change.
   */
  const currentCodeRef = useRef(currency.code);
  useEffect(() => {
    currentCodeRef.current = currency.code;
  }, [currency.code]);

  /**
   * Adopt the currency saved on the business.
   *
   * The cookie only records what was chosen on *this* device, so a fresh
   * browser would otherwise show the app default rather than the business's
   * actual currency. The profile is the record; the cookie is a cache of it,
   * and is what avoids a flash of the wrong symbol before this resolves.
   *
   * The API stores a symbol, and symbols are ambiguous, so the code already in
   * play breaks the tie — see `findCurrencyBySymbol`.
   */
  useEffect(() => {
    let cancelled = false;

    const seedFromProfile = async () => {
      const symbol = await fetchSavedCurrencySymbol();
      if (!symbol || cancelled) return;

      const saved = findCurrencyBySymbol(symbol, currentCodeRef.current);
      if (!saved || saved.code === currentCodeRef.current) return;

      setCurrencyState(saved);
      cacheLocally(saved.code);
    };

    seedFromProfile();
    return () => {
      cancelled = true;
    };
    // Once per mount: the business's currency is not expected to change
    // underneath a session that is not the one changing it.
  }, []);

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
