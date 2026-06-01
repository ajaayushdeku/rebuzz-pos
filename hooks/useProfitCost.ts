import { useQuery } from "@tanstack/react-query";
import {
  getProfitStats,
  getGrossProfitTrendData,
  getProfitPerProduct,
  getRefundReason,
  getBudgetData,
  getExpenseStats,
  getExpenseByCategoryData,
} from "@/services/dashboardServices/apiProfitCost";

// ── Profit stats (gross revenue, net profit, refunds, avg margin) ─────────

export const useProfitStats = () =>
  useQuery({
    queryKey: ["profit-stats"],
    queryFn: getProfitStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
