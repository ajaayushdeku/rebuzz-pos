"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Printer } from "lucide-react";

import ModalShell, { DocumentRow } from "@/components/ui/ModalShell";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import CreditInvoiceDocument, {
  CREDIT_DOCUMENT_TYPES,
  CREDIT_DOC_DESCRIPTIONS,
  CREDIT_DOC_LABELS,
  type CreditDocumentBusiness,
  type CreditDocumentCustomer,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

/**
 * Print for the credit's own documents.
 *
 * Separate from the invoice `PrintInvoiceModal` for the same reason as the PDF
 * export: that one fetches a ticket and prints `InvoicePreview`. The print
 * plumbing itself is shared — the same `.invoice-print-root` class in
 * globals.css hides everything else on the page while printing.
 */
export default function CreditPrintModal({
  open,
  onClose,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
}) {
  const [printType, setPrintType] = useState<CreditDocumentType | null>(null);

  // Held in a ref so the print effect below doesn't restart when the parent
  // passes a fresh inline `onClose` on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Dismissing mid-print must clear the chosen document, or reopening would
  // land straight back on the "opening the print dialog" state.
  const handleClose = () => {
    setPrintType(null);
    onClose();
  };

  // Once a format is chosen and its document has painted, open the browser
  // print dialog; clean up after the user finishes or cancels.
  useEffect(() => {
    if (!printType || !credit) return;

    const timer = setTimeout(() => window.print(), 300);
    const handleAfterPrint = () => {
      setPrintType(null);
      onCloseRef.current();
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printType, credit]);

  if (!open) return null;

  return (
    <>
      {/* Portaled to <body> so no ancestor's stacking context, overflow or
          transform can clip it out of the printed page. */}
      {printType &&
        credit &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="invoice-print-root">
            <CreditInvoiceDocument
              type={printType}
              minHeightPx={0}
              credit={credit}
              items={items}
              payments={payments}
              businessProfile={businessProfile}
              customerProfile={customerProfile}
            />
          </div>,
          document.body,
        )}

      <ModalShell
        open={open}
        onClose={handleClose}
        title="Print credit invoice"
        subtitle={
          credit ? `Credit #${credit.invoiceNo}` : "Choose a document to print"
        }
        icon={Printer}
      >
        {!credit ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading credit
          </div>
        ) : printType ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <div>
              <p className="text-[13px] font-medium text-gray-800">
                Opening the print dialog
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Printing {CREDIT_DOC_LABELS[printType]}. If nothing appears,
                check that pop-ups are allowed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrintType(null)}
              className="mt-1 text-[11px] font-semibold text-gray-500 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Back to documents
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {CREDIT_DOCUMENT_TYPES.map((type) => (
              <DocumentRow
                key={type}
                icon={FileText}
                label={CREDIT_DOC_LABELS[type]}
                description={CREDIT_DOC_DESCRIPTIONS[type]}
                trailing={
                  <button
                    type="button"
                    onClick={() => !printType && setPrintType(type)}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[12px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Printer size={13} />
                    Print
                  </button>
                }
              />
            ))}

            <p className="pt-1 text-[11px] leading-relaxed text-gray-400">
              Opens your browser&lsquo;s print dialog — pick a printer or save
              as PDF from there.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
