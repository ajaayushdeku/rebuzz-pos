"use client";

import { useQuery } from "@tanstack/react-query";

export type RefundEntry = {
  name: string;
  loss: number;
  invoiceNo: number;
  updatedAt: string;
  createdAt: string;
};

async function fetchRefundAnalysis(
  startDate: string,
  endDate: string,
): Promise<RefundEntry[]> {
  const res = await fetch(
    `/api/tickets/bills?startDate=${startDate}&endDate=${endDate}&limit=100`,
    { cache: "no-store" },
  );

  if (!res.ok) throw new Error(`Failed to fetch refunds: ${res.status}`);

  const json = await res.json();

  const bills: {
    ticketName: string;
    grandTotal: number;
    isRefunded: boolean;
    invoiceNo: number;
    createdAt: string;
    updatedAt: string;
  }[] = json?.data?.bill ?? [];

  return bills
    .filter((bill) => bill.isRefunded === true)
    .map((bill) => ({
      name: bill.ticketName || "Unknown",
      loss: bill.grandTotal ?? 0,
      invoiceNo: bill.invoiceNo,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    }));
}

export function useRefundAnalysis(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["refund-analysis", startDate, endDate],
    queryFn: () => fetchRefundAnalysis(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
