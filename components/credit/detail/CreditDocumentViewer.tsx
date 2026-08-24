"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Monitor, Printer, Smartphone } from "lucide-react";

import {
  buildPaginatedPdf,
  PDF_RENDER_HEIGHT_PX,
  PDF_RENDER_WIDTH_PX,
} from "@/lib/invoicePdf";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import CreditInvoiceDocument, {
  creditFileStem,
  type CreditDocumentBusiness,
  type CreditDocumentCustomer,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

type PreviewMode = "desktop" | "mobile";

const PREVIEW_MODES: {
  label: string;
  value: PreviewMode;
  icon: typeof Monitor;
}[] = [
  { label: "Desktop", value: "desktop", icon: Monitor },
  { label: "Mobile", value: "mobile", icon: Smartphone },
];

/**
 * Interactive chrome around one credit document: a Desktop / Mobile toggle,
 * and Print and Export buttons that act on the document being viewed.
 *
 * The visible document follows the toggle, but print and PDF always use a
 * separate off-screen A4 copy — so switching to the phone frame to check how
 * it reads never changes what the customer receives.
 */
export default function CreditDocumentViewer({
  type,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
}: {
  type: CreditDocumentType;
  credit: Credit;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
}) {
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [isExporting, setIsExporting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);
  const isMobile = previewMode === "mobile";

  const documentProps = {
    type,
    credit,
    items,
    payments,
    businessProfile,
    customerProfile,
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pdf = await buildPaginatedPdf(docRef);
      if (!pdf) throw new Error("Document not ready");
      pdf.save(`Credit-${credit.invoiceNo}-${creditFileStem(type)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
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
    <div className="w-full bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* Off-screen A4 copy: the export source, and the print body when
          printing. Portaled to <body> for print so no ancestor can clip it. */}
      <div aria-hidden className="absolute -left-[99999px] top-0">
        <div
          ref={docRef}
          className="bg-white"
          style={{ width: PDF_RENDER_WIDTH_PX }}
        >
          <CreditInvoiceDocument
            {...documentProps}
            minHeightPx={PDF_RENDER_HEIGHT_PX}
          />
        </div>
      </div>

      {printing &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="invoice-print-root">
            <div
              className="bg-white mx-auto"
              style={{ width: PDF_RENDER_WIDTH_PX }}
            >
              <CreditInvoiceDocument {...documentProps} minHeightPx={0} />
            </div>
          </div>,
          document.body,
        )}

      {/* Preview header */}
      <div className="relative bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-2 print:hidden">
        <div className="flex flex-col items-start gap-1 text-[11px] text-gray-400">
          <span className="font-medium text-gray-500">PREVIEW MODE</span>
          <span className="hidden lg:inline-block">
            You are previewing how your customer will see this credit.
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1 shrink-0">
          {PREVIEW_MODES.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreviewMode(value)}
              aria-pressed={previewMode === value}
              className={`flex flex-col items-center justify-center gap-1 min-w-[72px] px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                previewMode === value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              <span className="hidden lg:inline-block">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/records/credits/${credit._id}`)}
          className="text-sm font-semibold cursor-pointer text-blue-600 hover:text-blue-700 border-[3px] border-blue-200 hover:border-blue-300 rounded-2xl px-3 py-1.5 transition-colors"
        >
          Go Back to Rebuzz
        </button>
      </div>

      {/* Canvas */}
      <div
        className="bg-gray-100/60 py-2 flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-x-auto"
        style={{ minHeight: isMobile ? "600px" : "800px" }}
      >
        <div className="flex items-center justify-center gap-3 py-4 print:hidden">
          <button
            type="button"
            onClick={() => setPrinting(true)}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <Printer size={16} />
            <span className="hidden lg:inline-block">Print</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span className="hidden lg:inline-block">
              {isExporting ? "Exporting..." : "Export as PDF"}
            </span>
          </button>
        </div>

        <div
          className="overflow-hidden shadow-lg transition-all duration-300 ease-in-out"
          style={{
            width: isMobile ? "375px" : `${PDF_RENDER_WIDTH_PX}px`,
            borderRadius: isMobile ? "24px" : "4px",
            border: isMobile ? "8px solid #1f2937" : "1px solid #e5e7eb",
          }}
        >
          <CreditInvoiceDocument
            {...documentProps}
            isMobile={isMobile}
            minHeightPx={isMobile ? 0 : PDF_RENDER_HEIGHT_PX}
          />
        </div>
      </div>
    </div>
  );
}
