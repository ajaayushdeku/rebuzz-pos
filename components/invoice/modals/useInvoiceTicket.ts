"use client";

import { useQuery } from "@tanstack/react-query";

import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import { useBusiness } from "@/hooks/useBusiness";
import { InvoiceItemGroup } from "@/lib/types/invoice";
import {
  fetchCreditsClient,
  fetchCreditDetail,
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
 * For a credited invoice, resolve its credit and return the payment history.
 * Uses the same query key as the invoice detail page so the data is shared.
 */
export function useInvoiceCreditPayments(
  invoice: { invoice?: number; paidStatus?: string } | undefined,
  enabled: boolean,
): CreditPayment[] | null {
  const { data: creditDetail } = useQuery({
    queryKey: ["credit-detail-for-invoice", invoice?.invoice],
    queryFn: async () => {
      const credits = await fetchCreditsClient();
      const match = credits.find((c) => c.invoiceNo === invoice?.invoice);
      if (!match) return null;
      return fetchCreditDetail(match._id);
    },
    enabled:
      enabled &&
      invoice?.paidStatus === "credited" &&
      invoice?.invoice != null,
  });
  return creditDetail?.paymentHistory ?? null;
}

/** Extends {@link useInvoiceTicket} with business profile and paid-bill data,
 *  used by the Send Invoice and Print modals. */
export function useInvoiceDocumentData(
  invoiceNo: string | number | undefined,
  enabled: boolean,
) {
  const { invoice, customerProfile, isLoading } = useInvoiceTicket(
    invoiceNo,
    enabled,
  );
  const { data: business } = useBusiness();

  const { data: billData } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: enabled && !!invoice?.invoice,
    retry: false,
  });

  const payments = useInvoiceCreditPayments(invoice, enabled);

  return {
    invoice,
    customerProfile,
    business,
    billData: billData ?? null,
    payments,
    isLoading,
  };
}
