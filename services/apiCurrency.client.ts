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
