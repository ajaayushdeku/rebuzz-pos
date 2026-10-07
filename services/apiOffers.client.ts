"use client";

export type DiscountType = "percent" | "amount" | "bogo" | "freeItem";

/**
 * Deals that carry a number in `value`; the rest leave it out.
 *
 * Here beside the union rather than in the form, because it is a fact about the
 * type and both the builder and the offers list have to agree on it — one of
 * them deciding on its own is how an edit screen comes to show a "0% off".
 */
export function hasAmount(type: DiscountType): boolean {
  return type === "percent" || type === "amount";
}

export type OfferFormData = {
  // hasKey: string;
  // keykey: string;
  // hasValueFor: string;
  // endDate: string;
  // cardName: string;
  // discountType: string;
  // discount: number;
  // startDate: string;
  // note: string;
  // enabled: boolean;
  // repeatingDays: number[];
  // productId: string;

  name: string;
  type: DiscountType;
  value?: number;
  products?: string[];
  freeProduct?: string;
  minSpend?: number;
  perCustomerLimit?: number;
  startDate?: string;
  endDate?: string;
  days?: number[];
  startTime?: string;
  endTime?: string;
  code?: string;
  enabled: boolean;
};

export type Offer = {
  _id: string;
  name: string;
  type: DiscountType;
  value?: number;
  products?: string[];
  freeProduct?: string;
  minSpend?: number;
  perCustomerLimit?: number;
  startDate?: string;
  endDate?: string;
  days?: number[];
  startTime?: string;
  endTime?: string;
  code?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch("/api/offers");

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch offers");
  }

  const json = await res.json();

  /**
   * The POS answers `{ status, data: { offers: [...] } }`.
   *
   * This used to look for `data.offerCards`, then `offer_cards`, then fall back
   * to `data` — and since neither of the first two exists, every call fell
   * through to the third and returned the *object* `{ offers: [...] }` where the
   * caller expected an array. Typed as `Offer[]`, so nothing complained; it just
   * rendered nothing.
   *
   * The older names are kept as fallbacks in case an older POS build is still
   * answering somewhere, but `data.offers` is what the live API returns, and the
   * array fallback is last so a shape nobody recognises is an empty list rather
   * than an object pretending to be one.
   */
  return (
    json?.data?.offers ??
    json?.data?.offerCards ??
    json?.offer_cards ??
    (Array.isArray(json?.data) ? json.data : [])
  );
}

export async function createOffer(data: OfferFormData): Promise<Offer> {
  const res = await fetch("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create offer");
  }

  return res.json();
}

export async function updateOffer(
  id: string,
  data: OfferFormData,
): Promise<Offer> {
  const res = await fetch(`/api/offers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.error || errorData.message || "Failed to update offer",
    );
  }

  return res.json();
}

export async function enableDisableOffer(id: string): Promise<Offer> {
  const res = await fetch(`/api/offers/${id}/enable-disable`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.error || errorData.message || "Failed to enable/disable offer",
    );
  }

  return res.json();
}

export async function deleteOffer(id: string): Promise<Offer> {
  const res = await fetch(`/api/offers/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(
      errorData.error || errorData.message || "Failed to delete offer",
    );
  }

  return res.json();
}
