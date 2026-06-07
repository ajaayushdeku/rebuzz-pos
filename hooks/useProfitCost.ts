import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  getProfitStats,
  getGrossProfitTrendData,
  getProfitPerProduct,
  getRefundReason,
  getBudgetData,
  getExpenseStats,
  getExpenseByCategoryData,
} from "@/services/dashboardServices/apiProfitCost";

function getPresetRange(range: string): { startDate: string; endDate: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  let start: Date;

  switch (range) {
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate: start.toISOString().split("T")[0], endDate: end };
}

// ── Profit stats (gross revenue, net profit, refunds, avg margin) ─────────

export const useProfitStats = () => {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const range = searchParams.get("range");

  let effectiveStartDate: string | undefined;
  let effectiveEndDate: string | undefined;

  if (startDate && endDate) {
    effectiveStartDate = startDate;
    effectiveEndDate = endDate;
  } else if (range) {
    const preset = getPresetRange(range);
    effectiveStartDate = preset.startDate;
    effectiveEndDate = preset.endDate;
  }

  return useQuery({
    queryKey: ["profit-stats", effectiveStartDate, effectiveEndDate],
    queryFn: () => getProfitStats(effectiveStartDate, effectiveEndDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ── Gross profit trend (12 months) ───────────────────────────────────────

export const useGrossProfitTrend = () =>
  useQuery({
    queryKey: ["gross-profit-trend"],
    queryFn: getGrossProfitTrendData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ── Profit per product ────────────────────────────────────────────────────

export const useProfitPerProduct = () =>
  useQuery({
    queryKey: ["profit-per-product"],
    queryFn: getProfitPerProduct,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ── Refund reasons ────────────────────────────────────────────────────────

export const useRefundReason = () =>
  useQuery({
    queryKey: ["refund-reasons"],
    queryFn: getRefundReason,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ── Budget data ───────────────────────────────────────────────────────────

export const useBudgetData = () =>
  useQuery({
    queryKey: ["budget-data"],
    queryFn: getBudgetData,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ── Expense stats ─────────────────────────────────────────────────────────

export const useExpenseStats = () =>
  useQuery({
    queryKey: ["expense-stats"],
    queryFn: getExpenseStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ── Expense by category ───────────────────────────────────────────────────

export const useExpenseByCategory = () =>
  useQuery({
    queryKey: ["expense-by-category"],
    queryFn: getExpenseByCategoryData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
