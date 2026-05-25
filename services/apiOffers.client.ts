"use client";

export type OfferFormData = {
  hasKey: string;
  keykey: string;
  hasValueFor: string;
  endDate: string;
  cardName: string;
  discountType: string;
  discount: number;
  startDate: string;
  note: string;
  enabled: boolean;
  repeatingDays: number[];
  productId: string;
};

export type Offer = {
  _id: string;
  hasKey: string;
  keykey: string;
  hasValueFor: string;
  endDate: string;
  cardName: string;
  discountType: string;
  discount: number;
  startDate: string;
  note: string;
  enabled: boolean;
  repeatingDays: string[];
  productId: string;
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

  console.log("Offers:", json);
  return json?.data?.offerCards ?? json?.offer_cards ?? json?.data ?? [];
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
