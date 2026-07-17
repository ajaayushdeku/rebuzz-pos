import { fetchPaymentMethods } from "@/services/paymentMethods.client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const PAYMENT_METHODS_KEY = ["paymentMethods"] as const;

/**
 * React Query (suspense) hook for fetching payment methods data.
 * Suspends while loading (so the page's <Suspense> fallback shows) and throws
 * on error (caught by the page's <ChartErrorBoundary>). The dates are part of
 * the query key so a new key triggers a fresh fetch.
 *
 * @param startDate - Optional start date (YYYY-MM-DD)
 * @param endDate   - Optional end date (YYYY-MM-DD)
 */
export function usePaymentMethods(startDate?: string, endDate?: string) {
  return useSuspenseQuery({
    queryKey: [...PAYMENT_METHODS_KEY, startDate, endDate] as const,
    queryFn: () => fetchPaymentMethods(startDate, endDate),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
