import { useQuery } from "@tanstack/react-query";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";

// ── Query key factory ──────────────────────────────────────────────────────

export const transactionKeys = {
  all: ["transactions"] as const,
  detail: (invoiceNo: number) =>
    [...transactionKeys.all, "detail", invoiceNo] as const,
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTransactionDetail(invoiceNo: number | null) {
  return useQuery<Transaction>({
    queryKey: transactionKeys.detail(invoiceNo!),
    queryFn: () => getTransactionDetail(invoiceNo!),
    enabled: !!invoiceNo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
