import { findCurrencyBySymbol } from "@/lib/config/currencies";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * The currency code recorded on the account a token belongs to.
 *
 * The `currency` cookie is a per-device cache with no account in it, so
 * switching business would otherwise leave the previous one's symbol on every
 * figure until the client-side seeding effect caught up — and if that request
 * failed, indefinitely. Resolving it here, while the auth routes already have
 * the right token in hand, means the very first paint after a switch is right.
 *
 * Returns null when the account has no currency saved or the lookup fails; the
 * caller then clears the cookie rather than keeping a stale one.
 */
export async function currencyCodeForToken(
  token: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/business/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const symbol = data?.data?.user?.currency;
    if (typeof symbol !== "string" || !symbol.trim()) return null;

    return findCurrencyBySymbol(symbol.trim())?.code ?? null;
  } catch {
    return null;
  }
}
