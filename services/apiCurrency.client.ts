"use client";

/**
 * Save the business's currency.
 *
 * The backend stores the **symbol** rather than the ISO code — the payload is
 * `{ currency: "$" }` — so callers pass the symbol that belongs to the code
 * they picked.
 */
export async function updateCurrency(symbol: string): Promise<void> {
  const res = await fetch("/api/business/currency", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currency: symbol }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.status === "error") {
    throw new Error(
      (data as { message?: string })?.message || "Failed to update currency",
    );
  }
}

/**
 * The currency saved on the business, as the profile reports it.
 *
 * Returns the raw symbol — `/business/users/me` stores what
 * `updateCurrency` sent. Null when there is nothing saved, or when the
 * profile can't be read at all; either way the caller keeps what it has.
 */
export async function fetchSavedCurrencySymbol(): Promise<string | null> {
  try {
    const res = await fetch("/api/profile");
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const symbol = data?.data?.user?.currency;

    return typeof symbol === "string" && symbol.trim() ? symbol.trim() : null;
  } catch {
    return null;
  }
}
