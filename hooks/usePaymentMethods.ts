import { fetchPaymentMethods } from "@/services/paymentMethods.client";
import { useQuery } from "@tanstack/react-query";

export const PAYMENT_METHODS_KEY = ["paymentMethods"] as const;

/**
 * React Query hook for fetching payment methods data.
 * Accepts optional date range params. The dates are part of the query key
 * so a new key triggers a fresh fetch.
 *
 * @param startDate - Optional start date (YYYY-MM-DD)
 * @param endDate   - Optional end date (YYYY-MM-DD)
 */
export function usePaymentMethods(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...PAYMENT_METHODS_KEY, startDate, endDate] as const,
    queryFn: () => fetchPaymentMethods(startDate, endDate),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
