"use client";

import type jsPDF from "jspdf";

import { OffscreenLayer } from "@/components/ui/ModalShell";
import {
  buildPaginatedPdf,
  PDF_RENDER_HEIGHT_PX,
  PDF_RENDER_WIDTH_PX,
} from "@/lib/invoicePdf";
import type { Credit, CreditPayment } from "@/services/apiCredit.client";
import PaymentReceiptDocument, {
  receiptFileStem,
  type ReceiptBusiness,
  type ReceiptContext,
  type ReceiptCustomer,
} from "./PaymentReceiptDocument";

/**
 * Where a payment sits in its credit's history.
 *
 * Ordered oldest-first so the numbering matches the order the payments were
 * actually made, whichever way a given list happens to be sorted on screen.
 */
export function receiptContext(
  payments: CreditPayment[],
  payment: CreditPayment,
): ReceiptContext {
  const ordered = [...payments].sort((a, b) =>
    a.paymentDate.localeCompare(b.paymentDate),
  );
  const position = ordered.findIndex((p) => p._id === payment._id);
  const index = position === -1 ? ordered.length : position + 1;

  const paidToDate = ordered
    .slice(0, index)
    .reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0);

  return { index, total: ordered.length, paidToDate };
}

/**
 * One off-screen receipt, painted at page width so a PDF can be taken from it.
 *
 * A single node rather than one per payment: the credit documents can afford
 * to mount all three because there are always exactly three, but payments are
 * a list of unknown length and only ever one is being sent. Swapping
 * `payment` re-renders this node, and `buildReceiptPdf` waits for the repaint.
 */
export function PaymentReceiptOffscreen({
  documentRef,
  credit,
  payment,
  context,
  businessProfile,
  customerProfile,
}: {
  documentRef: React.RefObject<HTMLDivElement | null>;
  credit: Credit | null;
  payment: CreditPayment | null;
  context: ReceiptContext | null;
  businessProfile?: ReceiptBusiness | null;
  customerProfile?: ReceiptCustomer | null;
}) {
  if (!credit || !payment || !context) return null;

  return (
    <OffscreenLayer>
      <div style={{ width: PDF_RENDER_WIDTH_PX }}>
        <PaymentReceiptDocument
          documentRef={documentRef}
          minHeightPx={PDF_RENDER_HEIGHT_PX}
          credit={credit}
          payment={payment}
          context={context}
          businessProfile={businessProfile}
          customerProfile={customerProfile}
        />
      </div>
    </OffscreenLayer>
  );
}

/** Rasterise the off-screen receipt. Throws so callers can report the failure. */
export async function buildReceiptPdf(
  ref: React.RefObject<HTMLDivElement | null>,
): Promise<jsPDF> {
  if (!ref.current) throw new Error("Receipt not ready");

  // A tick for the off-screen receipt to finish painting. Longer than the
  // credit documents need, because this node re-renders when the selected
  // payment changes rather than being mounted once up front.
  await new Promise((r) => setTimeout(r, 250));

  const pdf = await buildPaginatedPdf(ref);
  if (!pdf) throw new Error("Failed to generate the receipt PDF");
  return pdf;
}

export const receiptPdfFileName = (
  credit: Credit,
  context: ReceiptContext,
): string => `${receiptFileStem(credit, context)}.pdf`;

/** Public share link for one payment's receipt. */
export const receiptPreviewUrl = (
  credit: Credit,
  payment: CreditPayment,
): string =>
  `${window.location.origin}/preview/receipt/${credit._id}/${payment._id}`;

/**
 * Email one payment's receipt.
 *
 * Sent as `billType: "invoice"` because that is the only value the backend
 * mailer is known to accept — there is no receipt type in the API's union yet.
 * The filename and the attached document are the receipt, so the customer
 * receives the right thing; only the type the backend records is approximate.
 */
export async function emailReceiptPdf({
  credit,
  context,
  pdf,
  recipientEmail,
  recipientName,
}: {
  credit: Credit;
  context: ReceiptContext;
  pdf: jsPDF;
  recipientEmail: string;
  recipientName?: string;
}): Promise<string | undefined> {
  const res = await fetch("/api/bills/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      billType: "invoice",
      // data:application/pdf;base64,… — the backend strips the prefix.
      pdfBase64: pdf.output("datauristring"),
      recipientEmail,
      recipientName: recipientName || credit.user?.name || undefined,
      fileName: receiptPdfFileName(credit, context),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || "Failed to email the receipt");
  }
  return data.message as string | undefined;
}
