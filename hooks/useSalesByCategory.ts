import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchSalesByCategoryClient } from "@/services/salesCategory.client";

export const SALES_BY_CATEGORY_KEY = ["salesByCategory"] as const;

/**
 * React Query (suspense) hook for fetching sales-by-category report data.
 * Suspends while loading (so the page's <Suspense> fallback shows) and throws
 * on error (caught by the page's <ChartErrorBoundary>). The dates are part of
 * the query key so a new key triggers a fresh fetch.
 *
 * @param startDate - Optional start date (YYYY-MM-DD)
 * @param endDate   - Optional end date (YYYY-MM-DD)
 */
export function useSalesByCategory(startDate?: string, endDate?: string) {
  return useSuspenseQuery({
    queryKey: [...SALES_BY_CATEGORY_KEY, startDate, endDate] as const,
    queryFn: () => fetchSalesByCategoryClient(startDate, endDate),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
