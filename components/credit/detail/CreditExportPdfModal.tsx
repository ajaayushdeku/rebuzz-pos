"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, FileText, Loader2 } from "lucide-react";

import ModalShell, { DocumentRow } from "@/components/ui/ModalShell";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import {
  buildCreditPdf,
  CreditDocumentsOffscreen,
  creditPdfFileName,
  useCreditDocumentRefs,
} from "./creditDocumentActions";
import {
  CREDIT_DOCUMENT_TYPES,
  CREDIT_DOC_DESCRIPTIONS,
  CREDIT_DOC_LABELS,
  type CreditDocumentBusiness,
  type CreditDocumentCustomer,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

/**
 * PDF export for the credit's own documents.
 *
 * Separate from the invoice `ExportPdfModal` because that one loads a ticket
 * by invoice number and rasterises `InvoicePreview`. Everything here is
 * already in hand — the caller passes the credit detail straight through — so
 * there is no fetching, and the file that lands matches the preview on screen.
 */
export default function CreditExportPdfModal({
  open,
  onClose,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
  billData,
  showPan = true,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
  billData?: Transaction | null;
  /** Whether the business PAN is printed on the documents. */
  showPan?: boolean;
}) {
  const refs = useCreditDocumentRefs();

  const [generatingFor, setGeneratingFor] = useState<CreditDocumentType | null>(
    null,
  );

  const handleDownload = async (type: CreditDocumentType) => {
    if (!credit || generatingFor) return;
    try {
      setGeneratingFor(type);
      const pdf = await buildCreditPdf(refs[type]);
      pdf.save(creditPdfFileName(credit, type));
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
      <CreditDocumentsOffscreen
        refs={refs}
        credit={credit}
        items={items}
        payments={payments}
        businessProfile={businessProfile}
        customerProfile={customerProfile}
        billData={billData}
        showPan={showPan}
      />

      <ModalShell
        open={open}
        onClose={onClose}
        busy={!!generatingFor}
        title="Export as PDF"
        subtitle={
          credit
            ? `Credit #${credit.invoiceNo} · printable copy`
            : "Printable copy"
        }
        icon={FileText}
      >
        {!credit ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading credit
          </div>
        ) : (
          <div className="space-y-2">
            {CREDIT_DOCUMENT_TYPES.map((type) => {
              const isGenerating = generatingFor === type;
              return (
                <DocumentRow
                  key={type}
                  icon={FileText}
                  label={CREDIT_DOC_LABELS[type]}
                  description={CREDIT_DOC_DESCRIPTIONS[type]}
                  trailing={
                    <button
                      type="button"
                      onClick={() => handleDownload(type)}
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
              Each file is A4 and ready to print, with the credit&lsquo;s
              payments and outstanding due.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
