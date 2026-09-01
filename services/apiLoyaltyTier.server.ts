import type { LoyaltyStatus } from "@/components/settingsComponents/loyaltyPoints/loyaltyStatusConfig";
import { mapTiers, type RawLoyaltyTier } from "./apiLoyaltyTier.client";
import { authHeaders } from "./authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * The business's loyalty ladder, read from a server component or service.
 *
 * The client copy of this call goes through `/api/loyalty-tier`, which is no
 * use here — a relative URL has no origin on the server. This one talks to the
 * upstream API directly with the session attached, and shares `mapTiers` so a
 * tier is coloured identically on both sides.
 *
 * `no-store` rather than a revalidate window: Next keys its data cache on the
 * URL alone, so a cached ladder would follow the reader into a different
 * business after an account switch. It is also edited from the settings page,
 * where a stale list would hide the business's own change.
 *
 * Returns an empty ladder on failure, which callers read as "no tiers" — the
 * same thing they show a business that has not configured any.
 */
export async function fetchLoyaltyTiersServer(): Promise<LoyaltyStatus[]> {
  try {
    const res = await fetch(`${BASE}/business/loyaltytier`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`fetchLoyaltyTiersServer failed: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const list = Array.isArray(json?.data)
      ? (json.data as RawLoyaltyTier[])
      : [];
    return mapTiers(list);
  } catch (err) {
    console.error("fetchLoyaltyTiersServer error:", err);
    return [];
  }
}

/** The ladder in the shape `getLoyaltyStatus` bands against. */
export function toTierBands(tiers: LoyaltyStatus[]) {
  return tiers.map((tier) => ({ name: tier.name, minPoints: tier.minPoints }));
}
