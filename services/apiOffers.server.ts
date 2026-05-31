import { authHeaders } from "./authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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
  const res = await fetch(`${BASE}/business/offer_cards`, {
    headers: await authHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch offers: ${res.status}`);
  }

  const json = await res.json();

  // console.log("Offers:", json);
  return json?.data?.offerCards ?? json?.offer_cards ?? json?.data ?? [];
}
