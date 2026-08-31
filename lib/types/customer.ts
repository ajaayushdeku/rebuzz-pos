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

/**
 * A tier name.
 *
 * A plain string rather than a union: the ladder is configured per business
 * through the loyalty settings, so "Bronze" and "Platinum" are two possible
 * names among any the business chooses, not the whole set.
 */
export type LoyaltyTier = string;

/**
 * One rung of a business's ladder — the shape `getLoyaltyStatus` needs.
 *
 * Structurally what `LoyaltyStatus` from the loyalty settings already is, so
 * the configured tiers can be handed over directly. Declared here rather than
 * imported so this module stays free of component imports.
 */
export type LoyaltyTierBand = { name: string; minPoints: number };

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

/**
 * What a customer below the ladder's lowest rung is called.
 *
 * Not a tier — the absence of one. A business whose ladder starts at 300 has
 * said nothing about someone on 40, and inventing a bottom rung for them
 * would put words in its mouth.
 */
export const NO_TIER = "No tier";

/**
 * The ladder used when the business has none configured.
 *
 * Kept as the fallback rather than deleted: a business that has not set its
 * tiers up still needs its customers banded somehow, and every caller that
 * cannot reach the settings — server renders, dashboard aggregates — lands
 * here.
 */
const TIER_THRESHOLDS: { min: number; max: number; tier: LoyaltyTier }[] = [
  { min: 0, max: 499, tier: "Bronze" },
  { min: 500, max: 999, tier: "Silver" },
  { min: 1000, max: 2999, tier: "Gold" },
  { min: 3000, max: Infinity, tier: "Platinum" },
];

/**
 * The tier a point total falls into.
 *
 * `tiers` is the business's configured ladder. Given one, the answer is the
 * highest rung the customer has reached — a ladder is a set of floors — or
 * `NO_TIER` when they are below all of them.
 *
 * Only a business with no ladder at all falls back to the built-in
 * thresholds. Reaching for those when a ladder exists but does not cover a
 * customer would answer a question the business has deliberately left open.
 */
export function getLoyaltyStatus(
  points: number,
  tiers?: LoyaltyTierBand[],
): LoyaltyTier {
  if (tiers?.length) {
    const reached = [...tiers]
      .sort((a, b) => a.minPoints - b.minPoints)
      .reduce<LoyaltyTierBand | undefined>(
        (best, tier) => (points >= tier.minPoints ? tier : best),
        undefined,
      );
    return reached ? reached.name : NO_TIER;
  }

  const match = TIER_THRESHOLDS.find((t) => points >= t.min && points <= t.max);
  return match?.tier ?? "Bronze";
}

/**
 * A raw API customer in the shape the app uses.
 *
 * `tiers` is optional so the many callers that have no way to reach the
 * loyalty settings — server fetchers, the invoice edit lookups — keep working
 * on the built-in thresholds. Anywhere the configured ladder is available it
 * should be passed, and the banding is then the business's own.
 */
export function mapRawCustomerToCustomer(
  raw: RawCustomer,
  tiers?: LoyaltyTierBand[],
): Customer {
  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    numberOfPurchases: raw.numberOfPurchases,
    totalDueAmount: raw.totalDueAmount,
    loyaltyPoint: raw.loyaltyPoint,
    loyaltyStatus: getLoyaltyStatus(raw.loyaltyPoint, tiers),
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
