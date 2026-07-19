export type RawCustomer = {
  _id: string;
  name: string;
  email: string | null;
  phone: string;
  countryCode?: string;
  loyaltyPoint: number;
  numberOfPurchases?: number;
  totalDueAmount?: number;
  isDeactivated?: boolean;
  note?: string | null;
  customerPan?: string | null;
  /** Server-relative path, e.g. "images/users/user_xxx.jpg" */
  image?: string | null;
};
export type RawCustomerListResponse = {
  status: string;
  data: {
    users: RawCustomer[];
  };
};

export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  numberOfPurchases?: number;
  totalDueAmount?: number;
  loyaltyPoint: number;
  loyaltyStatus: LoyaltyTier;
  note?: string | null;
  isDeactivated?: boolean;
  customerPan?: string | null;
  /** Server-relative path, e.g. "images/users/user_xxx.jpg" */
  image?: string | null;
};

export interface IndividualCustomer {
  name: string;
  phone: string;
  email: string | null;
  totalDueAmount?: number;
  loyaltyPoint: number;
}

/** Tier thresholds based on loyalty points */
const TIER_THRESHOLDS: { min: number; max: number; tier: LoyaltyTier }[] = [
  { min: 0, max: 499, tier: "Bronze" },
  { min: 500, max: 999, tier: "Silver" },
  { min: 1000, max: 2999, tier: "Gold" },
  { min: 3000, max: Infinity, tier: "Platinum" },
];

export function getLoyaltyStatus(points: number): LoyaltyTier {
  const match = TIER_THRESHOLDS.find((t) => points >= t.min && points <= t.max);
  return match?.tier ?? "Bronze";
}

export function mapRawCustomerToCustomer(raw: RawCustomer): Customer {
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    numberOfPurchases: raw.numberOfPurchases,
    totalDueAmount: raw.totalDueAmount,
    loyaltyPoint: raw.loyaltyPoint,
    loyaltyStatus: getLoyaltyStatus(raw.loyaltyPoint),
    note: raw.note ?? null,
    isDeactivated: raw.isDeactivated ?? false,
    customerPan: raw.customerPan ?? null,
    image: raw.image ?? null,
  };
}

/**
 * Resolve a customer's stored image path to an absolute URL. The API returns a
 * server-relative path ("images/users/user_xxx.jpg") which is served from the
 * API host root, i.e. NEXT_PUBLIC_API_URL without its trailing "/api".
 */
export function getCustomerImageUrl(image?: string | null): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  if (!base) return null;

  return `${base}/${image.replace(/^\//, "")}`;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface CustomerTableProps {
  customers: Customer[];
}

export interface CustomerRowProps {
  customer: Customer;
}
