"use client";

import { useQuery } from "@tanstack/react-query";
import type { CompareSalesPoint } from "@/services/dashboardServices/apiSalesCompare";
import {
  getCompareSalesByDate,
  getCompareSalesByWeek,
  getCompareSalesByMonth,
} from "@/services/dashboardServices/apiSalesCompare";

// ── Date range helpers ─────────────────────────────────────────────────────

function getDateRange(view: "daily" | "weekly" | "monthly"): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const start = new Date(now);

  switch (view) {
    case "daily":
      start.setDate(now.getDate() - 30);
      break;
    case "weekly":
      start.setDate(now.getDate() - 180);
      break;
    case "monthly":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate: start.toISOString().split("T")[0], endDate };
}

// ── API resolver ───────────────────────────────────────────────────────────

const API_FETCHER: Record<
  "daily" | "weekly" | "monthly",
  (startDate?: string, endDate?: string) => Promise<CompareSalesPoint[]>
> = {
  daily: getCompareSalesByDate,
  weekly: getCompareSalesByWeek,
  monthly: getCompareSalesByMonth,
};

// ── Query key factory ──────────────────────────────────────────────────────

export const salesTrendKeys = {
  all: ["sales-trends"] as const,
  lists: () => [...salesTrendKeys.all, "list"] as const,
  list: (view: string, startDate: string, endDate: string) =>
    [...salesTrendKeys.lists(), view, startDate, endDate] as const,
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSalesTrends(view: "daily" | "weekly" | "monthly") {
  const { startDate, endDate } = getDateRange(view);
  const fetcher = API_FETCHER[view];

  return useQuery({
    queryKey: salesTrendKeys.list(view, startDate, endDate),
    queryFn: () => fetcher(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
