"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import InvoicePreview from "@/components/invoice/InvoicePreview";

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
    <div className="h-dvh overflow-hidden bg-gray-50 py-10 px-4">
      {/* The page is exactly the viewport and does not scroll; the document
          below scrolls inside it. That keeps the window free of a scrollbar
          that appears and disappears as modals lock the page, and it is what
          `useLockAppScroll` freezes when one opens — hence the marker. */}
      <div data-app-scroll className="scrollbar-hide h-full overflow-y-auto">
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
    </div>
  );
}
