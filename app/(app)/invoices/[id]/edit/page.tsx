"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { useInvoiceCredit } from "@/components/invoice/modals/useInvoiceTicket";
import InvoiceForm from "@/components/invoice/InvoiceForm";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketByInvoice(id),
    enabled: !!id,
  });

  const invoice = data?.data?.Tickets;

  // Detect whether this invoice is a credit invoice and load its full detail
  // (credit + items + payment history) so the form can switch to credit mode.
  const { credit, detail: creditDetail } = useInvoiceCredit(
    invoice,
    !!invoice?.invoice,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Invoice not found.</p>
      </div>
    );
  }

  // If this is a credit invoice, wait for its detail (items) to load so the
  // form is populated with the credit's items rather than the ticket's.
  if (credit && !creditDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <InvoiceForm
      initialData={data.data} // ← data.data not data?.data on the outer wrapper
      isEditMode={true}
      invoiceNumber={id}
      isCreditInvoice={!!credit}
      credit={credit ?? undefined}
      creditDetails={creditDetail ?? undefined}
      creditId={credit?._id}
      creditUserId={credit?.user?._id}
      creditItems={creditDetail?.items ?? []}
      creditPaymentHistory={creditDetail?.paymentHistory ?? []}
    />
  );
}
