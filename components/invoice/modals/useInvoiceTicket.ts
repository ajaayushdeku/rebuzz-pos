"use client";

import { useQuery } from "@tanstack/react-query";

import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import { useBusiness } from "@/hooks/useBusiness";
import { InvoiceItemGroup } from "@/lib/types/invoice";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import {
  fetchCreditsClient,
  fetchCreditsByStatus,
  fetchCreditDetail,
  type Credit,
  type CreditDetail,
  type CreditPayment,
} from "@/services/apiCredit.client";

/** Loosely-typed ticket/invoice shape returned by `getTicketByInvoice`. */
export interface TicketInvoice {
  _id: string;
  invoice: number;
  ticketName: string;
  customerEmail: string;
  phoneNumber: string;
  grandTotal: number;
  total: number;
  taxamt?: number;
  discount?: number;
  discountByPoints?: number;
  ticketTakenBy: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemGroup[];
  paidStatus?: string;
  paymentMethod?: string;
  sentAt?: string;
  dueDate?: string;
}

export interface CustomerProfile {
  name?: string;
  email?: string;
  phone?: string;
  loyaltyPoint?: number;
  customerPan?: string;
}

/**
 * Shared loader for invoice modals. Uses the same query keys as the invoice
 * detail page so data is reused from the cache when available, and invalidating
 * these keys after a mutation refreshes every consumer at once.
 */
export function useInvoiceTicket(
  invoiceNo: string | number | undefined,
  enabled: boolean,
) {
  const idStr = invoiceNo != null && invoiceNo !== "" ? String(invoiceNo) : "";

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", idStr],
    queryFn: () => getTicketByInvoice(idStr),
    enabled: enabled && !!idStr,
  });

  const invoice: TicketInvoice | undefined = data?.data?.Tickets;

  const { data: customerProfile } = useQuery<CustomerProfile | null>({
    queryKey: ["customer-lookup", invoice?.phoneNumber, invoice?.customerEmail],
    queryFn: async () => {
      const identifier = invoice?.phoneNumber || invoice?.customerEmail;
      if (!identifier) return null;
      const query = invoice?.phoneNumber
        ? `phone=${invoice.phoneNumber}`
        : `email=${invoice?.customerEmail}`;
      const response = await fetch(`/api/customers/lookup?${query}`);
      const result = await response.json();
      return result?.data?.users?.[0] || null;
    },
    enabled: enabled && !!invoice,
  });

  return { invoice, customerProfile: customerProfile ?? null, isLoading };
}

/**
 * Detect whether an invoice was ever a credit invoice — regardless of its
 * current paidStatus or where the user navigated from — and load that credit's
 * full detail (items + payment history).
 *
 * It matches the invoice number against both the current credits (`getall`)
 * and the completed-credit records, so a credit that has since been fully paid
 * is still recognised. Query keys are shared with the credits page so the
 * lists are reused from cache.
 */
export function useInvoiceCredit(
  invoice: { invoice?: number } | undefined,
  enabled: boolean,
): { credit: Credit | null; detail: CreditDetail | null } {
  const invoiceNo = invoice?.invoice;

  const { data: currentCredits } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCreditsClient,
    enabled: enabled && invoiceNo != null,
    staleTime: 5 * 60 * 1000,
  });
  const { data: completedCredits } = useQuery({
    queryKey: ["credits", "completed"],
    queryFn: () => fetchCreditsByStatus("completed"),
    enabled: enabled && invoiceNo != null,
    staleTime: 5 * 60 * 1000,
  });

  const credit =
    invoiceNo != null
      ? ((currentCredits ?? []).find((c) => c.invoiceNo === invoiceNo) ??
        (completedCredits ?? []).find((c) => c.invoiceNo === invoiceNo) ??
        null)
      : null;

  const { data: detail = null } = useQuery({
    queryKey: ["credit-detail-by-id", credit?._id],
    queryFn: () => fetchCreditDetail(credit!._id),
    enabled: enabled && !!credit?._id,
  });

  return { credit, detail };
}

/**
 * Payment history for an invoice that was ever a credit invoice (ongoing or
 * completed). Returns null for invoices that were never credits.
 */
export function useInvoiceCreditPayments(
  invoice: { invoice?: number } | undefined,
  enabled: boolean,
): CreditPayment[] | null {
  const { detail } = useInvoiceCredit(invoice, enabled);
  return detail?.paymentHistory ?? null;
}

/** Extends {@link useInvoiceTicket} with business profile, paid-bill data and,
 *  when the invoice was ever a credit invoice, its payment history. */
export function useInvoiceDocumentData(
  invoiceNo: string | number | undefined,
  enabled: boolean,
) {
  const { invoice, customerProfile, isLoading } = useInvoiceTicket(
    invoiceNo,
    enabled,
  );
  const { data: business } = useBusiness();

  const { data: realBillData } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: enabled && !!invoice?.invoice,
    retry: false,
  });

  const { credit, detail } = useInvoiceCredit(invoice, enabled);
  const payments = detail?.paymentHistory ?? null;

  // A completed credit may have no POS transaction. When it doesn't, synthesise
  // a bill from the credit detail so the preview still renders the full "bill"
  // layout (grand total, payment mode, loyalty points). Ongoing credits keep
  // the plain preview.
  const isCompletedCredit =
    !!credit && ((credit.dueAmount ?? 0) <= 0 || credit.status === "completed");

  let billData: Transaction | null = realBillData ?? null;
  if (isCompletedCredit && detail && !billData) {
    const c = detail.credit;
    const history = [...(detail.paymentHistory ?? [])].sort((a, b) =>
      a.paymentDate.localeCompare(b.paymentDate),
    );
    const lastPayment = history[history.length - 1];
    billData = {
      id: c._id,
      date: c.creationDate,
      timestamp: c.creationDate,
      invoiceName: "",
      amount: String(c.grandTotal ?? 0),
      paymentMethod: (lastPayment?.paymentMethod ?? "cash") as never,
      items: [],
      status: "success" as never,
      discount: c.discount ?? 0,
      taxAmount: c.taxamt ?? 0,
      invoiceNo: c.invoiceNo,
      currentPoint: customerProfile?.loyaltyPoint ?? 0,
      totalPoints: customerProfile?.loyaltyPoint ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as unknown as Transaction;
  }

  return {
    invoice,
    customerProfile,
    business,
    billData,
    payments,
    isLoading,
  };
}
