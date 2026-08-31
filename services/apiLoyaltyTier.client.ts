import {
  FALLBACK_TIER_STYLE,
  STATUS_COLORS,
  TIER_PALETTE,
  type LoyaltyStatus,
} from "@/components/settingsComponents/loyaltyPoints/loyaltyStatusConfig";

/** One tier exactly as the API returns it. */
export interface RawLoyaltyTier {
  _id: string;
  adminId?: string;
  name: string;
  minPoint: number;
  createdAt?: string;
  updatedAt?: string;
}

/** What create and update take. `minPoint` goes as a string, per the API. */
export interface LoyaltyTierPayload {
  name: string;
  minPoint: string;
}

/**
 * Colour a tier for the table.
 *
 * A tier the app knows by name keeps its established colour — gold is always
 * the gold swatch, wherever it sits in the ladder. Anything a business invents
 * takes the next unused swatch from the palette, so two tiers are never the
 * same shade by accident until all twenty are spoken for.
 */
function styleFor(name: string, taken: Set<string>) {
  const known = STATUS_COLORS[name.trim().toLowerCase()];
  if (known) return { color: known.color, bgColor: known.bg };

  const free = TIER_PALETTE.find((swatch) => !taken.has(swatch.key));
  if (!free) {
    return {
      color: FALLBACK_TIER_STYLE.color,
      bgColor: FALLBACK_TIER_STYLE.bg,
    };
  }

  taken.add(free.key);
  return { color: free.color, bgColor: free.bg };
}

/**
 * The API's tiers in the shape the table already speaks.
 *
 * Colour is assigned here rather than stored: the API records a name and a
 * threshold, which is the whole of what a tier is. How it is painted is this
 * app's business.
 */
export function mapTiers(raw: RawLoyaltyTier[]): LoyaltyStatus[] {
  // Names claim their own colour first, so an invented tier cannot take the
  // gold swatch from a tier actually called gold further down the list.
  const taken = new Set<string>(
    raw
      .map((t) => STATUS_COLORS[t.name.trim().toLowerCase()]?.key)
      .filter((key): key is string => key !== undefined),
  );

  return raw.map((t) => {
    const { color, bgColor } = styleFor(t.name, taken);
    return {
      id: t._id,
      name: t.name,
      minPoints: Number(t.minPoint) || 0,
      color,
      bgColor,
    };
  });
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export async function fetchLoyaltyTiers(): Promise<LoyaltyStatus[]> {
  const res = await fetch("/api/loyalty-tier", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to load loyalty tiers"));
  }

  const json = await res.json();
  const list = Array.isArray(json?.data) ? (json.data as RawLoyaltyTier[]) : [];
  return mapTiers(list);
}

export async function createLoyaltyTier(
  payload: LoyaltyTierPayload,
): Promise<void> {
  const res = await fetch("/api/loyalty-tier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readError(res, "Failed to add the loyalty status"));
  }
}

export async function updateLoyaltyTier(
  id: string,
  payload: LoyaltyTierPayload,
): Promise<void> {
  const res = await fetch(`/api/loyalty-tier/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await readError(res, "Failed to update the loyalty status"),
    );
  }
}

export async function deleteLoyaltyTier(id: string): Promise<void> {
  const res = await fetch(`/api/loyalty-tier/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(
      await readError(res, "Failed to delete the loyalty status"),
    );
  }
}
