"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { getTicketByInvoice } from "@/services/apiTicket.client";

import InvoiceForm from "@/components/invoice/InvoiceForm";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketByInvoice(id),
    enabled: !!id,
  });
  // console.log(data);
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <InvoiceForm
        initialData={data?.data}
        isEditMode={true}
        invoiceNumber={id}
      />
    </div>
  );
}
