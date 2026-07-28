import { useQuery } from "@tanstack/react-query";
import {
  fetchLiveTables,
  fetchTodaysTableSales,
} from "@/services/apiTables.client";

export const LIVE_TABLES_KEY = ["live-tables"] as const;
export const TABLE_LIVE_SALES_KEY = ["table-live-sales"] as const;

/** Live restaurant tables from GET /api/tables. Polls every 30s for freshness. */
export function useLiveTables() {
  return useQuery({
    queryKey: LIVE_TABLES_KEY,
    queryFn: fetchLiveTables,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** Today's dine-in (table) sales total for the Live Sales stat. */
export function useTableLiveSales() {
  return useQuery({
    queryKey: TABLE_LIVE_SALES_KEY,
    queryFn: fetchTodaysTableSales,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
