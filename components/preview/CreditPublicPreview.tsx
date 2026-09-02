"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useBusiness } from "@/hooks/useBusiness";
import { fetchCreditDetail } from "@/services/apiCredit.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import CreditDocumentViewer from "@/components/credit/detail/CreditDocumentViewer";
import { creditState } from "@/components/credit/detail/creditDetailHelpers";
import type { CreditDocumentType } from "@/components/credit/detail/CreditInvoiceDocument";

/**
 * The customer-facing view of a credit, living beside the invoice previews at
 * `/preview/credit/…`.
 *
 * Keyed by the credit's own id, like the credit detail page — the route the
 * customer receives points at the credit, not at the ticket behind it, so the
 * document always reflects the current dues.
 */
export default function CreditPublicPreview({
  type,
}: {
  type: CreditDocumentType;
}) {
  const { id } = useParams();
  const creditId = typeof id === "string" ? id : "";

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

  /**
   * A POS bill is only minted when the credit is settled at the till, so an
   * ongoing or archived credit has nothing to fetch. Those render from the
   * credit record alone.
   */
  const { data: billData } = useQuery({
    queryKey: ["bill-detail", credit?.invoiceNo],
    queryFn: () => getTransactionDetail(credit!.invoiceNo),
    enabled: !!credit?.invoiceNo && creditState(credit) === "completed",
    retry: false,
  });

  // Only for the customer's tax id — everything else on the document comes
  // from the credit itself.
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
    return <div className="p-20 text-center">Credit not found.</div>;
  }

  return (
    <div className="h-dvh overflow-hidden bg-blue-50">
      {/* The page is exactly the viewport and does not scroll; the document
          below scrolls inside it. That keeps the window free of a scrollbar
          that appears and disappears as modals lock the page, and it is what
          `useLockAppScroll` freezes when one opens — hence the marker. */}
      <div data-app-scroll className="scrollbar-hide h-full overflow-y-auto">
        <CreditDocumentViewer
          type={type}
          credit={credit}
          items={detail?.items ?? []}
          payments={detail?.paymentHistory ?? []}
          businessProfile={business}
          customerProfile={customerProfile}
          billData={billData ?? null}
        />
      </div>
    </div>
  );
}
