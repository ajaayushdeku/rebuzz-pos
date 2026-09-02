"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { fetchCreditDetail } from "@/services/apiCredit.client";
import PaymentReceiptViewer from "@/components/credit/detail/PaymentReceiptViewer";
import { receiptContext } from "@/components/credit/detail/paymentReceiptActions";

/**
 * The customer-facing view of one payment's receipt.
 *
 * Keyed by credit id *and* payment id: a credit can hold many payments, and a
 * link that named only the credit would be a link to the whole history rather
 * than to the instalment the customer was sent.
 *
 * The payment is read out of the credit detail rather than fetched on its own —
 * there is no per-payment endpoint, and the surrounding payments are needed
 * anyway to number this one and total what has been paid so far.
 */
export default function ReceiptPublicPreview() {
  const params = useParams();
  const creditId = typeof params.creditId === "string" ? params.creditId : "";
  const paymentId =
    typeof params.paymentId === "string" ? params.paymentId : "";

  const {
    data: detail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["credit-detail-by-id", creditId],
    queryFn: () => fetchCreditDetail(creditId),
    enabled: !!creditId,
  });

  const { data: business, isLoading: bizLoading } = useBusiness();

  const credit = detail?.credit ?? null;
  const payments = detail?.paymentHistory ?? [];
  const payment = payments.find((p) => p._id === paymentId) ?? null;

  // Only for the customer's display name — the receipt takes everything else
  // from the credit and the payment.
  const { data: customerProfile } = useQuery({
    queryKey: ["customer-lookup", credit?.user?.email, undefined],
    queryFn: async () => {
      const response = await fetch(
        `/api/customers/lookup?email=${credit?.user?.email}`,
      );
      const result = await response.json();
      return result?.data?.users?.[0] || null;
    },
    enabled: !!credit?.user?.email,
  });

  if (isLoading || bizLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !credit) {
    return <div className="p-20 text-center">Receipt not found.</div>;
  }

  // The credit exists but this payment does not — a removed payment, or a
  // link that was edited by hand. Said plainly rather than falling back to
  // some other payment's receipt, which would be worse than an error.
  if (!payment) {
    return (
      <div className="p-20 text-center">
        <p className="text-gray-700">This payment is no longer on record.</p>
        <p className="mt-1 text-sm text-gray-400">
          It may have been removed from invoice #{credit.invoiceNo}.
        </p>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-blue-50">
      {/* The page is exactly the viewport and does not scroll; the document
          below scrolls inside it. That keeps the window free of a scrollbar
          that appears and disappears as modals lock the page, and it is what
          `useLockAppScroll` freezes when one opens — hence the marker. */}
      <div data-app-scroll className="scrollbar-hide h-full overflow-y-auto">
        <PaymentReceiptViewer
          credit={credit}
          payment={payment}
          context={receiptContext(payments, payment)}
          businessProfile={business}
          customerProfile={customerProfile}
          backHref={`/records/credits/${credit._id}`}
        />
      </div>
    </div>
  );
}
