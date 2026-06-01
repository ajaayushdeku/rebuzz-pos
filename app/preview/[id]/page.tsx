"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import InvoicePreview from "@/components/dashboardComponents/salesRevenue/invoice/InvoicePreview";

export default function PublicPreviewPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const isProforma = searchParams.get("proforma") === "true";
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
  // console.log("Invovice Data:", invoice);

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

  // Fetch bill detail for paid invoices to get enriched data (cashier name, etc.)
  const [billData, setBillData] = useState<null | Awaited<
    ReturnType<typeof getTransactionDetail>
  >>(null);

  useEffect(() => {
    if (invoice?.paidStatus === "paid" && invoice?.invoice) {
      getTransactionDetail(invoice.invoice)
        .then(setBillData)
        .catch(() => console.warn("Could not fetch bill detail"));
    }
  }, [invoice?.paidStatus, invoice?.invoice]);

  if (invLoading || bizLoading)
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
          type={isProforma ? "proforma" : "invoice"}
          invoice={invoice}
          businessProfile={business}
          customerProfile={customerProfile}
          billData={billData}
        />
      </div>
    </div>
  );
}
