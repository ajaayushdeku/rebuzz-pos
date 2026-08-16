"use client";

import toast from "react-hot-toast";
import { useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import ModalShell, {
  DocumentRow,
  OffscreenLayer,
} from "@/components/ui/ModalShell";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import {
  INVOICE_TYPES,
  SHORT_LABELS,
  DESCRIPTIONS,
  fileStemFor,
  type InvoiceType,
} from "@/components/invoice/InvoiceDocuments";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

interface ExportPdfModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

export default function ExportPdfModal({
  open,
  onClose,
  invoiceNo,
}: ExportPdfModalProps) {
  const { invoice, customerProfile, business, billData, payments, credit } =
    useInvoiceDocumentData(invoiceNo, open);

  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);

  const [generatingFor, setGeneratingFor] = useState<InvoiceType | null>(null);

  const refMap = {
    proforma: proformaRef,
    invoice: regularRef,
    tax: taxRef,
  } as const;

  const handleDownloadPDF = async (type: InvoiceType) => {
    if (!invoice || generatingFor) return;
    try {
      setGeneratingFor(type);
      const pdf = await buildInvoicePdf(refMap[type]);
      if (!pdf) throw new Error("Invoice preview not ready");
      pdf.save(`Invoice-${invoice.invoice}-${fileStemFor(type)}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingFor(null);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Off-screen previews used to render the PDF images. */}
      {invoice && (
        <OffscreenLayer>
          {INVOICE_TYPES.map((t) => (
            <InvoicePreview
              key={t}
              type={t}
              invoiceRef={refMap[t]}
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={billData}
              payments={payments}
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
          ))}
        </OffscreenLayer>
      )}

      <ModalShell
        open={open}
        onClose={onClose}
        busy={!!generatingFor}
        title="Export as PDF"
        subtitle={
          invoice?.invoice != null
            ? `Invoice #${invoice.invoice} · printable copy`
            : "Printable copy"
        }
        icon={FileText}
      >
        {!invoice ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading invoice
          </div>
        ) : (
          <div className="space-y-2">
            {INVOICE_TYPES.map((type) => {
              const isGenerating = generatingFor === type;
              return (
                <DocumentRow
                  key={type}
                  icon={FileText}
                  label={SHORT_LABELS[type]}
                  description={DESCRIPTIONS[type]}
                  trailing={
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(type)}
                      disabled={!!generatingFor}
                      className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[12px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Preparing
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          Download
                        </>
                      )}
                    </button>
                  }
                />
              );
            })}

            <p className="pt-1 text-[11px] leading-relaxed text-gray-400">
              Each file is A4 and ready to print.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
