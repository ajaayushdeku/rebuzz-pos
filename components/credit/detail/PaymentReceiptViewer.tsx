"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Printer } from "lucide-react";

import {
  buildPaginatedPdf,
  PDF_RENDER_HEIGHT_PX,
  PDF_RENDER_WIDTH_PX,
} from "@/lib/invoicePdf";
import type { Credit, CreditPayment } from "@/services/apiCredit.client";
import PaymentReceiptDocument, {
  RECEIPT_CARD_WIDTH_PX,
  receiptFileStem,
  type ReceiptBusiness,
  type ReceiptContext,
  type ReceiptCustomer,
} from "./PaymentReceiptDocument";

/**
 * The customer-facing view of one receipt.
 *
 * Same chrome as `CreditDocumentViewer` — print, export, back to ReBuzz — with
 * the Desktop/Mobile toggle deliberately left out. That toggle exists so a
 * business can check how an invoice reflows in a narrow frame; a receipt is a
 * single centred column that reads the same at any width, so the control would
 * only offer a choice that changes nothing.
 */
export default function PaymentReceiptViewer({
  credit,
  payment,
  context,
  businessProfile,
  customerProfile,
  /** Where "Go Back to Rebuzz" lands. */
  backHref,
}: {
  credit: Credit;
  payment: CreditPayment;
  context: ReceiptContext;
  businessProfile?: ReceiptBusiness | null;
  customerProfile?: ReceiptCustomer | null;
  backHref: string;
}) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);

  const documentProps = {
    credit,
    payment,
    context,
    businessProfile,
    customerProfile,
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pdf = await buildPaginatedPdf(docRef);
      if (!pdf) throw new Error("Receipt not ready");
      pdf.save(`${receiptFileStem(credit, context)}.pdf`);
    } catch (err) {
      console.error("Receipt PDF export error:", err);
      toast.error("Failed to export the receipt");
    } finally {
      setIsExporting(false);
    }
  };

  // Once the print copy has painted, open the browser print dialog.
  useEffect(() => {
    if (!printing) return;
    const timer = setTimeout(() => window.print(), 300);
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  return (
    <div className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Off-screen A4 copy: the export source. Kept separate from the visible
          receipt so what the customer downloads is always page-width. */}
      <div aria-hidden className="absolute -left-[99999px] top-0">
        <div
          ref={docRef}
          className="bg-white"
          style={{ width: PDF_RENDER_WIDTH_PX }}
        >
          <PaymentReceiptDocument
            {...documentProps}
            minHeightPx={PDF_RENDER_HEIGHT_PX}
          />
        </div>
      </div>

      {printing &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="invoice-print-root">
            <PaymentReceiptDocument {...documentProps} minHeightPx={0} />
          </div>,
          document.body,
        )}

      {/* Preview header */}
      <div className="relative flex items-center justify-between gap-2 border-b border-gray-200 bg-blue-100 px-5 py-3 print:hidden">
        <div className="flex flex-col items-start gap-1 text-[11px] text-gray-400">
          <span className="font-medium text-blue-600">RECEIPT</span>
          <span className="hidden lg:inline-block text-blue-500">
            Payment {context.index} of {context.total} on invoice #
            {credit.invoiceNo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setPrinting(true)}
              className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700  transition-all hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
            >
              <Printer size={16} />
              {/* <span className="hidden lg:inline-block">Print</span> */}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700  transition-all hover:border-blue-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-printer"
            >
              <Download size={16} />
              {/* <span className="hidden lg:inline-block">
                {isExporting ? "Exporting..." : "Export as PDF"}
              </span> */}
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="shrink-0 cursor-pointer rounded-2xl border-[3px] border-blue-200 px-3 py-1.5 bg-blue-50 items-center justify-center text-sm font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:text-blue-700 cursor-pointer"
          >
            Back to{" "}
            {credit.ticketName
              ? `${credit.ticketName} #${credit.invoiceNo}`
              : `Invoice #${credit.invoiceNo}`}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-col items-center justify-center overflow-x-auto bg-blue-50 py-6">
        <div
          className="mb-6 w-full overflow-hidden rounded-md "
          style={{ maxWidth: `${RECEIPT_CARD_WIDTH_PX}px` }}
        >
          <PaymentReceiptDocument {...documentProps} minHeightPx={0} />
        </div>
      </div>
    </div>
  );
}
