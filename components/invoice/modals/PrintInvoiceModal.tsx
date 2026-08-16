"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, FileText, Loader2 } from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import ModalShell, { DocumentRow } from "@/components/ui/ModalShell";
import {
  INVOICE_TYPES,
  SHORT_LABELS,
  DESCRIPTIONS,
  type InvoiceType,
} from "@/components/invoice/InvoiceDocuments";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

interface PrintInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

export default function PrintInvoiceModal({
  open,
  onClose,
  invoiceNo,
}: PrintInvoiceModalProps) {
  const { invoice, customerProfile, business, billData, payments, credit } =
    useInvoiceDocumentData(invoiceNo, open);

  const [printType, setPrintType] = useState<InvoiceType | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Held in a ref so the print effect below doesn't restart when the parent
  // passes a fresh inline `onClose` on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handlePrint = (type: InvoiceType) => {
    if (!invoice || printType) return;
    // Render the chosen preview into the print root; the effect below opens
    // the browser print dialog once it has painted.
    setPrintType(type);
  };

  // Once a format is chosen and its preview is rendered, open the browser
  // print dialog; clean up after the user finishes or cancels.
  useEffect(() => {
    if (!printType || !invoice) return;

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
  }, [printType, invoice]);

  // Never leave the modal stuck on the printing state if it's dismissed.
  useEffect(() => {
    if (!open) setPrintType(null);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/*
        Printable content — hidden on screen, isolated for print via CSS.
        Portaled to <body> so no ancestor's stacking context, overflow or
        transform can clip it out of the printed page.
      */}
      {mounted &&
        printType &&
        invoice &&
        createPortal(
          <div className="invoice-print-root">
            <InvoicePreview
              type={printType}
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={billData}
              payments={payments}
              // credit={credit}
              credit={
                credit
                  ? {
                      total: credit.total,
                      grandTotal: credit.grandTotal,
                      taxamt: credit.taxamt,
                      user: {
                        _id: credit.user?._id ?? "",
                        name: credit.user?.name ?? "",
                        phone: credit.user?.phone ?? "",
                        email: credit.user?.email ?? "",
                      },
                    }
                  : null
              }
            />
          </div>,
          document.body,
        )}

      <ModalShell
        open={open}
        onClose={onClose}
        title="Print invoice"
        subtitle={
          invoice?.invoice != null
            ? `Invoice #${invoice.invoice}`
            : "Choose a document to print"
        }
        icon={Printer}
      >
        {!invoice ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading invoice
          </div>
        ) : printType ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <div>
              <p className="text-[13px] font-medium text-gray-800">
                Opening the print dialog
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Printing {SHORT_LABELS[printType]}. If nothing appears, check
                that pop-ups are allowed.
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
            {INVOICE_TYPES.map((type) => (
              <DocumentRow
                key={type}
                icon={FileText}
                label={SHORT_LABELS[type]}
                description={DESCRIPTIONS[type]}
                trailing={
                  <button
                    type="button"
                    onClick={() => handlePrint(type)}
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
