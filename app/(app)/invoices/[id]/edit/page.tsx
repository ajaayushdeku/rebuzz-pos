"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import InvoiceForm from "@/components/invoice/InvoiceForm";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketByInvoice(id),
    enabled: !!id,
  });

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

  return (
    <InvoiceForm
      initialData={data.data} // ← data.data not data?.data on the outer wrapper
      isEditMode={true}
      invoiceNumber={id}
    />
  );
}
