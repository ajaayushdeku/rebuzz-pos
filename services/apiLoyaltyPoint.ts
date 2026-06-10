export type LoyaltyPointSettings = {
  _id: string;
  adminId: string;
  businessId: string;
  loyaltyPointPercentage: number;
  redeemLimit: number;
  basePoint: number;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyPointPayload = {
  loyaltyPoint: number; // percentage earned per invoice
  redeemLimit: number; // max points redeemable per invoice
  basePoint: number; // points earned per base unit
};

export const fetchLoyaltyPointSettings =
  async (): Promise<LoyaltyPointSettings | null> => {
    const res = await fetch("/api/loyalty-point");

    // If 404, no settings exist yet — return null, don't throw
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch loyalty point settings");

    const json = await res.json();
    // console.log("Loyalty Points:", json);

    return json;
  };

export const updateLoyaltyPointSettings = async (
  payload: LoyaltyPointPayload,
): Promise<LoyaltyPointSettings> => {
  const res = await fetch("/api/loyalty-point", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update loyalty point settings");

  const json = await res.json();
  return json?.data;
};

export const createLoyaltyPointSettings = async (
  payload: LoyaltyPointPayload & { businessName: string },
): Promise<LoyaltyPointSettings> => {
  const res = await fetch("/api/loyalty-point", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create loyalty point settings");

  const json = await res.json();
  return json?.data;
};
