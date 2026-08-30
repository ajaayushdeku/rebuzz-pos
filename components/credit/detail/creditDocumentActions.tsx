"use client";

import { useRef } from "react";
import type jsPDF from "jspdf";

import { OffscreenLayer } from "@/components/ui/ModalShell";
import {
  buildPaginatedPdf,
  PDF_RENDER_HEIGHT_PX,
  PDF_RENDER_WIDTH_PX,
} from "@/lib/invoicePdf";
import { BILL_TYPE } from "@/components/invoice/InvoiceDocuments";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import CreditInvoiceDocument, {
  CREDIT_DOCUMENT_TYPES,
  creditFileStem,
  type CreditDocumentBusiness,
  type CreditDocumentCustomer,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

export type CreditDocumentRefs = Record<
  CreditDocumentType,
  React.RefObject<HTMLDivElement | null>
>;

/** One ref per document, in the order the three are rendered. */
export function useCreditDocumentRefs(): CreditDocumentRefs {
  const proforma = useRef<HTMLDivElement | null>(null);
  const invoice = useRef<HTMLDivElement | null>(null);
  const tax = useRef<HTMLDivElement | null>(null);
  return { proforma, invoice, tax };
}

/**
 * The three credit documents, painted off-screen at page width so a PDF can be
 * rasterised from any of them.
 *
 * They must actually render — a node that has never painted cannot be
 * captured — which is why this is mounted rather than created on demand.
 */
export function CreditDocumentsOffscreen({
  refs,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
  billData,
  showPan = true,
}: {
  refs: CreditDocumentRefs;
  credit: Credit | null;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
  billData?: Transaction | null;
  /** Whether the business PAN is printed on the documents. */
  showPan?: boolean;
}) {
  if (!credit) return null;

  return (
    <OffscreenLayer>
      {CREDIT_DOCUMENT_TYPES.map((type) => (
        <div key={type} style={{ width: PDF_RENDER_WIDTH_PX }}>
          <CreditInvoiceDocument
            type={type}
            documentRef={refs[type]}
            minHeightPx={PDF_RENDER_HEIGHT_PX}
            credit={credit}
            items={items}
            payments={payments}
            businessProfile={businessProfile}
            customerProfile={customerProfile}
            billData={billData}
            showPan={showPan}
          />
        </div>
      ))}
    </OffscreenLayer>
  );
}

/** Rasterise one off-screen document. Throws so callers can report per type. */
export async function buildCreditPdf(
  ref: React.RefObject<HTMLDivElement | null>,
): Promise<jsPDF> {
  if (!ref.current) throw new Error("Credit document not ready");

  // A tick for the off-screen document to finish painting.
  await new Promise((r) => setTimeout(r, 200));

  const pdf = await buildPaginatedPdf(ref);
  if (!pdf) throw new Error("Failed to generate PDF");
  return pdf;
}

export const creditPdfFileName = (
  credit: Credit,
  type: CreditDocumentType,
): string => `Credit-${credit.invoiceNo}-${creditFileStem(type)}.pdf`;

/**
 * Email one credit document. Uses the same endpoint and payload shape as the
 * invoice mailer — only the attachment differs.
 */
export async function emailCreditPdf({
  credit,
  type,
  pdf,
  recipientEmail,
}: {
  credit: Credit;
  type: CreditDocumentType;
  pdf: jsPDF;
  recipientEmail: string;
}): Promise<string | undefined> {
  const res = await fetch("/api/bills/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      billType: BILL_TYPE[type],
      // data:application/pdf;base64,… — the backend strips the prefix.
      pdfBase64: pdf.output("datauristring"),
      recipientEmail,
      recipientName: credit.user?.name || undefined,
      fileName: `credit-${creditFileStem(type)}-${credit.invoiceNo}.pdf`,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || "Failed to email the credit");
  }
  return data.message as string | undefined;
}

/** Public share link for one credit document. */
export const creditPreviewUrl = (
  credit: Credit,
  type: CreditDocumentType,
): string =>
  `${window.location.origin}/preview/credit/${creditFileStem(type)}/${credit._id}`;
