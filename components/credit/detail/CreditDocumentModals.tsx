"use client";

import { useQuery } from "@tanstack/react-query";

import { useBusiness } from "@/hooks/useBusiness";
import { fetchCreditDetail } from "@/services/apiCredit.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import { creditState } from "./creditDetailHelpers";
import CreditSendModal from "./CreditSendModal";
import CreditExportPdfModal from "./CreditExportPdfModal";
import CreditPrintModal from "./CreditPrintModal";

export type CreditDocumentAction = "send" | "export" | "print";

/**
 * The credit's document actions, for callers that hold only a credit id.
 *
 * The credits table lists credits without their items or payment history, but
 * every document is built from those — so this loads the detail on demand and
 * hands it to whichever modal was asked for. The query key is the same one the
 * credit detail page uses, so opening a document from the table and then the
 * page itself costs one fetch, not two.
 */
export default function CreditDocumentModals({
  creditId,
  action,
  onClose,
}: {
  creditId: string | null;
  action: CreditDocumentAction | null;
  onClose: () => void;
}) {
  const enabled = !!creditId && !!action;

  const { data: detail } = useQuery({
    queryKey: ["credit-detail-by-id", creditId],
    queryFn: () => fetchCreditDetail(creditId!),
    enabled,
  });

  const { data: business } = useBusiness();
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

  // Only for the customer's tax id — the rest of the document comes from the
  // credit itself.
  const { data: customerProfile } = useQuery({
    queryKey: ["customer-lookup", credit?.user?.email, undefined],
    queryFn: async () => {
      const response = await fetch(
        `/api/customers/lookup?email=${credit?.user?.email}`,
      );
      const result = await response.json();
      return result?.data?.users?.[0] || null;
    },
    enabled: enabled && !!credit?.user?.email,
  });

  if (!enabled) return null;

  // Each modal renders nothing while closed, and shows its own loading state
  // until the detail arrives.
  const shared = {
    credit,
    items: detail?.items ?? [],
    payments: detail?.paymentHistory ?? [],
    businessProfile: business,
    customerProfile,
    billData: billData ?? null,
  };

  return (
    <>
      <CreditSendModal open={action === "send"} onClose={onClose} {...shared} />
      <CreditExportPdfModal
        open={action === "export"}
        onClose={onClose}
        {...shared}
      />
      <CreditPrintModal
        open={action === "print"}
        onClose={onClose}
        {...shared}
      />
    </>
  );
}
