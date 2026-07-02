export interface PaymentMethodRevenue {
  paymentMethod: string;
  totalRevenue: number;
  transactionCount: number;
}

export const fetchPaymentMethods = async (
  startDate?: string,
  endDate?: string,
): Promise<PaymentMethodRevenue[]> => {
  const end = endDate || new Date().toISOString().split("T")[0];
  const start =
    startDate ||
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  const res = await fetch(
    `/api/tickets/bills?startDate=${start}&endDate=${end}&limit=1000`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch payment methods: ${res.status}`);
  }

  const json = await res.json();

  const bills: {
    paymentMethod?: string;
    grandTotal?: number;
  }[] = json?.data?.bill ?? [];

  const paymentMap = new Map<
    string,
    { totalRevenue: number; transactionCount: number }
  >();

  for (const bill of bills) {
    const method = (bill.paymentMethod ?? "Unknown").trim();

    // Normalize case so "Cash" and "cash" are treated the same
    const normalizedMethod =
      method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();

    const revenue = bill.grandTotal ?? 0;

    const current = paymentMap.get(normalizedMethod);

    if (current) {
      current.totalRevenue += revenue;
      current.transactionCount += 1;
    } else {
      paymentMap.set(normalizedMethod, {
        totalRevenue: revenue,
        transactionCount: 1,
      });
    }
  }

  return Array.from(paymentMap.entries()).map(([paymentMethod, stats]) => ({
    paymentMethod,
    totalRevenue: stats.totalRevenue,
    transactionCount: stats.transactionCount,
  }));
};
