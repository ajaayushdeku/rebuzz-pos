interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
}

interface DiscountPayload {
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
}

// Fetch/Get Discount Coupons
export const fetchDiscounts = async (): Promise<Discount[]> => {
  const res = await fetch("/api/discounts");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch discounts");
  }
  const rawData = await res.json();
  const data = rawData?.data?.discount?.[0]?.discounts || [];
  // console.log(data);
  return data;
};

// Create New Discount Coupon
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
