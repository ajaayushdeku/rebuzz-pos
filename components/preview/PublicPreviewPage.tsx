"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import { useInvoiceCredit } from "../invoice/modals/useInvoiceTicket";
import InvoicePreview from "../invoice/InvoicePreview";

type InvoiceType = "proforma" | "invoice" | "tax";

const PublicPreviewPage = ({ type }: { type: InvoiceType }) => {
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
    queryKey: ["customer-lookup", invoice?.customerEmail, invoice?.phoneNumber],
    queryFn: async () => {
      const identifier =
        invoice?.customerEmail ||
        creditForInvoice?.user?.phone ||
        invoice?.phoneNumber;
      if (!identifier) return null;

      // const query = invoice.phoneNumber
      //   ? `phone=${invoice.phoneNumber}`
      //   : `email=${invoice.customerEmail}`;

      const query = `email=${invoice.customerEmail}`;
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
  // Same rule as the invoice detail page: no bill exists until the invoice has
  // been through the till, so unpaid and outstanding credited ones skip it.
  const hasBill =
    invoice?.paidStatus === "paid" || invoice?.paidStatus === "refunded";

  const { data: billData, isLoading: billLoading } = useQuery({
    queryKey: ["bill-detail", invoice?.invoice],
    queryFn: () => getTransactionDetail(invoice!.invoice),
    enabled: !!invoice?.invoice && hasBill,
    retry: false,
  });

  const { detail: creditDetail } = useInvoiceCredit(invoice, !!invoice);
  const creditForInvoice = creditDetail?.credit ?? null;
  const payments = creditDetail?.paymentHistory ?? [];

  const handlePreviewBack = () => {
    // The page scrolls inside its own container now, so scrolling the window
    // would move nothing.
    document
      .querySelector("[data-app-scroll]")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // console.log("Bill Data:", billData);

  if (invLoading || bizLoading || billLoading)
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!invoice)
    return <div className="p-20 text-center">Invoice not found.</div>;

  return (
    <div className="h-dvh overflow-hidden bg-blue-50">
      {/* The page is exactly the viewport and does not scroll; the document
          below scrolls inside it. That keeps the window free of a scrollbar
          that appears and disappears as modals lock the page, and it is what
          `useLockAppScroll` freezes when one opens — hence the marker. */}
      <div data-app-scroll className="scrollbar-hide h-full overflow-y-auto">
        <InvoicePreview
          type={type}
          invoice={invoice}
          withControls
          businessProfile={business}
          customerProfile={customerProfile}
          billData={billData ?? null}
          payments={payments}
          // credit={
          //   creditForInvoice
          //     ? {
          //         total: creditForInvoice.total,
          //         grandTotal: creditForInvoice.grandTotal,
          //         taxamt: creditForInvoice.taxamt,
          //         user: creditForInvoice.user,
          //       }
          //     : null
          // }

          credit={
            creditForInvoice
              ? {
                  total: creditForInvoice.total,
                  grandTotal: creditForInvoice.grandTotal,
                  taxamt: creditForInvoice.taxamt,
                  user: {
                    _id: creditForInvoice.user?._id ?? "",
                    name: creditForInvoice.user?.name ?? "",
                    phone: creditForInvoice.user?.phone ?? "",
                    email: creditForInvoice.user?.email ?? "",
                  },
                }
              : null
          }
        />
      </div>
    </div>
  );
};
export default PublicPreviewPage;
