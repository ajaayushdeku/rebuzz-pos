import { DiscountType } from "./apiOffers.client";
import { authHeaders } from "./authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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
  const res = await fetch(`${BASE}/business/offers/getall`, {
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
