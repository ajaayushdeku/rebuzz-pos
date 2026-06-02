export interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
  _docId?: string;
}

// interface DiscountPayload {
//   name: string;
//   isEnabled: boolean;
//   rate: number;
//   type: "percentage" | "fixed";
// }

interface RawDiscountItem {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
}

interface RawDiscountParent {
  _id: string;
  discounts: RawDiscountItem[];
}

interface RawDiscountResponse {
  data?: {
    discount?: RawDiscountParent[];
  };
}

// Fetch/Get Discount Coupons
export const fetchDiscounts = async (): Promise<Discount[]> => {
  const res = await fetch("/api/discounts");
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    throw new Error(
      (errorData as { message?: string }).message ||
        "Failed to fetch discounts",
    );
  }
  const rawData: RawDiscountResponse = await res.json();
  // rawData.data.discount[0] holds the parent document
  const parent = rawData?.data?.discount?.[0];
  const items: RawDiscountItem[] = parent?.discounts || [];

  // Attach the parent doc _id to each discount so the page has it
  const docId: string | undefined = parent?._id;
  return items.map((item: RawDiscountItem) => ({
    ...item,
    _docId: docId, // used by update/delete
  }));
};

// Create New Discount Coupon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDiscount = async (discountData: any): Promise<Discount> => {
  const res = await fetch("/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(discountData),
  });

  if (!res.ok) throw new Error("Failed to create discount");
  return res.json();
};

// Update Discount Coupon
export const updateDiscount = async ({
  docId,
  discountId,
  payload,
}: {
  docId: string;
  discountId: string;
  payload: { name: string; rate: number; type: string };
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/discounts/${docId}/${discountId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    throw new Error(
      (errorData as { message?: string }).message ||
        "Failed to update discount",
    );
  }
  return res.json();
};

// Delete Discount Coupon
export const deleteDiscount = async ({
  docId,
  discountId,
}: {
  docId: string;
  discountId: string;
}): Promise<Record<string, unknown>> => {
  const res = await fetch(`/api/discounts/${docId}/${discountId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    throw new Error(
      (errorData as { message?: string }).message ||
        "Failed to delete discount",
    );
  }
  return res.json();
};
