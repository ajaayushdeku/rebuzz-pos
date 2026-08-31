"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { fetchCreditDetail } from "@/services/apiCredit.client";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { creditState } from "@/components/credit/detail/creditDetailHelpers";
import { mapRawCustomerToCustomer, type Customer } from "@/lib/types/customer";
import InvoiceForm from "@/components/invoice/InvoiceForm";

/**
 * Editing a credit, keyed by the credit's own id.
 *
 * `/invoices/{invoiceNo}/edit` still edits a credited invoice and is untouched;
 * this is the same form reached the way the credit pages address things. The
 * lookup runs the other way round — credit first, then the ticket behind it —
 * which is also cheaper: the invoice route has to pull the current, completed
 * and archived credit lists and scan all three for a matching invoice number,
 * while a credit id fetches one record.
 *
 * The ticket is still needed. It carries the base the credit was raised from —
 * the note, the original discount, the created date, the customer email — and
 * `InvoiceForm` reads those from `initialData`. Everything the credit owns in
 * its own right is taken from the credit instead; see `initialData` below.
 */
export default function Page() {
  const params = useParams();
  const router = useRouter();
  const creditId = params.id as string;

  const {
    data: detail,
    isLoading: creditLoading,
    error: creditError,
  } = useQuery({
    queryKey: ["credit-detail-by-id", creditId],
    queryFn: () => fetchCreditDetail(creditId),
    enabled: !!creditId,
  });

  const credit = detail?.credit ?? null;
  const invoiceNo = credit?.invoiceNo;

  const {
    data: ticketData,
    isLoading: ticketLoading,
    error: ticketError,
  } = useQuery({
    queryKey: ["ticket", invoiceNo != null ? String(invoiceNo) : ""],
    queryFn: () => getTicketByInvoice(String(invoiceNo)),
    enabled: invoiceNo != null,
  });

  const { data: customerProfile } = useQuery<Customer | null>({
    queryKey: ["customer-lookup", credit?.user?.email, credit?.user?.phone],
    queryFn: async () => {
      const response = await fetch(
        `/api/customers/lookup?email=${credit?.user?.email}`,
      );
      const result = await response.json();
      const raw = result?.data?.users?.[0];
      return raw ? mapRawCustomerToCustomer(raw) : null;
    },
    enabled: !!credit?.user?.email,
  });

  /**
   * The ticket, with the fields the credit owns laid over it.
   *
   * The form reads its base from `initialData`, so rather than teaching
   * `InvoiceForm` a second set of rules — which would change behaviour on the
   * invoice route too — the override happens here, where it only affects this
   * page. `ticketName` is the one that matters: the form saves a title through
   * `updateCredit`, so reading it back off the ticket would show the old name
   * every time the page was reopened.
   *
   * Copied rather than mutated: this object belongs to the query cache.
   */
  const initialData = useMemo(() => {
    const base = ticketData?.data;
    if (!base || !credit) return base;

    return {
      ...base,
      customerName: credit.user?.name ?? base.customerName,
      Tickets: {
        ...base.Tickets,
        ticketName: credit.ticketName ?? base.Tickets?.ticketName,
      },
    };
  }, [ticketData?.data, credit]);

  if (creditLoading || (invoiceNo != null && ticketLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (creditError || !credit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Credit not found.</p>
      </div>
    );
  }

  /**
   * The same gate the credit page puts on its Edit action.
   *
   * Without it the route is a way round that check: a settled or archived
   * credit is a record of what was owed, not something still being agreed.
   */
  const state = creditState(credit);
  if (state === "completed" || state === "archived") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-gray-600">
          This credit is {state === "completed" ? "settled" : "archived"} and
          can no longer be edited.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/records/credits/${creditId}`)}
          className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Back to the credit
        </button>
      </div>
    );
  }

  // The credit exists but the ticket it was raised from does not, so there is
  // no base to edit against. Said plainly rather than rendering an empty form.
  if (ticketError || !initialData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-gray-600">
          The invoice behind this credit could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/records/credits/${creditId}`)}
          className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Back to the credit
        </button>
      </div>
    );
  }

  return (
    <InvoiceForm
      initialData={initialData}
      isEditMode={true}
      invoiceNumber={String(credit.invoiceNo)}
      isCreditInvoice
      credit={credit}
      creditDetails={detail ?? undefined}
      creditId={credit._id}
      creditUserId={credit.user?._id}
      creditItems={detail?.items ?? []}
      creditPaymentHistory={detail?.paymentHistory ?? []}
      customerProfile={customerProfile ?? undefined}
    />
  );
}
