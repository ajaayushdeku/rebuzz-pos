"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import InvoicePreview from "../invoice/InvoicePreview";

type InvoiceType = "proforma" | "invoice" | "tax";

export default function PublicPreviewPage({ type }: { type: InvoiceType }) {
  const { id } = useParams();

  const {
    data,
    isLoading: invLoading,
    error,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketByInvoice(id as string),
    enabled: !!id,
  });

  const invoice = data?.data?.Tickets;
  // console.log("Invoice Data:", invoice);

  const { data: customerData, isLoading: isCustomerLoading } = useQuery({
    queryKey: ["customer-lookup", invoice?.phoneNumber, invoice?.customerEmail],
    queryFn: async () => {
      const identifier = invoice?.phoneNumber || invoice?.customerEmail;
      if (!identifier) return null;

      const query = invoice.phoneNumber
        ? `phone=${invoice.phoneNumber}`
        : `email=${invoice.customerEmail}`;
      const response = await fetch(`/api/customers/lookup?${query}`);
      const result = await response.json();
      // console.log(result);
      return result?.data?.users?.[0] || null;
    },
    enabled: !!invoice,
  });

  const customerProfile = customerData;

  const { data: business, isLoading: bizLoading } = useBusiness();

  // Fetch bill/transaction data — works for paid invoices (404 for unpaid is handled silently)
  const { data: billData, isLoading: billLoading } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: !!invoice?.invoice,
    retry: false,
  });

  // console.log("Bill Data:", billData);

  if (invLoading || bizLoading || billLoading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin inline" />
      </div>
    );
  if (!invoice)
    return <div className="p-20 text-center">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <InvoicePreview
          type={type}
          invoice={invoice}
          businessProfile={business}
          customerProfile={customerProfile}
          billData={billData ?? null}
        />
      </div>
    </div>
  );
}
