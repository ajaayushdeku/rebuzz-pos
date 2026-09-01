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
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
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
  billData,
}: {
  type: CreditDocumentType;
  credit: Credit;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
  billData?: Transaction | null;
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
    billData,
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

  const NAME_LIMIT = 8;

  const shortName = (name?: string | null): string => {
    const clean = (name ?? "").trim();
    return clean.length > NAME_LIMIT
      ? `${clean.slice(0, NAME_LIMIT)}...`
      : clean;
  };

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
            {/* Full width, like the credit print modal — the print root is
                already forced to the page width. */}
            <CreditInvoiceDocument {...documentProps} minHeightPx={0} />
          </div>,
          document.body,
        )}

      {/* Preview header */}
      <div className="relative bg-blue-100 border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-2 print:hidden">
        <div className="flex flex-col items-start gap-1 text-[11px] text-blue-400">
          <span className="font-medium text-blue-500">PREVIEW MODE</span>
          <span className="hidden lg:inline-block">
            You are previewing how your customer will see this credit.
          </span>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white border border-blue-200 rounded-xl p-1 gap-1 shrink-0">
          {PREVIEW_MODES.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreviewMode(value)}
              aria-pressed={previewMode === value}
              className={`flex flex-row items-center justify-center gap-2 min-w-[50px] md:min-w-[72px] px-2 md:px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                previewMode === value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-blue-700 hover:bg-blue-50"
              }`}
            >
              <Icon size={16} />
              <span className="hidden font-bold text-[13px] lg:inline-block">
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Print and export act on the whole preview, so they live in the
              header with the other controls rather than over the canvas. */}
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setPrinting(true)}
              className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
            >
              <Printer size={16} />
              <span className="hidden lg:inline-block">Print</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              <span className="hidden lg:inline-block">
                {isExporting ? "Exporting..." : "Export as PDF"}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/records/credits/${credit._id}`)}
            className="shrink-0 cursor-pointer rounded-2xl border-[3px] border-blue-200 px-3 py-1.5 bg-blue-50 items-center justify-center text-[13px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            Back to{" "}
            {`${shortName(credit.ticketName)} · ${credit.invoiceNo && `#${credit.invoiceNo}`}` ||
              `Invoice #${credit.invoiceNo}`}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="bg-blue-50 py-6 flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-x-auto"
        style={{ minHeight: isMobile ? "600px" : "800px" }}
      >
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
