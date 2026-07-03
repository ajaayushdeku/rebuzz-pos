"use client";

import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText } from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

type InvoiceType = "proforma" | "invoice" | "tax";

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
  const { invoice, customerProfile, business, billData } =
    useInvoiceDocumentData(invoiceNo, open);

  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const refMap = {
    proforma: proformaRef,
    invoice: regularRef,
    tax: taxRef,
  } as const;

  const handleDownloadPDF = async (
    ref: React.RefObject<HTMLDivElement | null>,
    suffix: string,
  ) => {
    if (!ref.current || !invoice) return;
    try {
      setGeneratingFor(suffix);
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${invoice.invoice}-${suffix}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingFor(null);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <>
      {/* Off-screen previews used to render the PDF images. */}
      {invoice && (
        <div aria-hidden className="absolute -left-[99999px] top-0">
          {(["proforma", "invoice", "tax"] as InvoiceType[]).map((t) => (
            <InvoicePreview
              key={t}
              type={t}
              invoiceRef={refMap[t]}
              invoice={invoice}
              customerProfile={customerProfile}
              businessProfile={business}
              billData={billData}
            />
          ))}
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Export as PDF</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Download a printable invoice document
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* ── Content ── */}
          <div className="px-5 py-4">
            {!invoice ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                Loading invoice...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { label: "Proforma", type: "proforma", ref: proformaRef },
                    { label: "Invoice", type: "invoice", ref: regularRef },
                    { label: "Tax Invoice", type: "tax", ref: taxRef },
                  ] as {
                    label: string;
                    type: InvoiceType;
                    ref: React.RefObject<HTMLDivElement | null>;
                  }[]
                ).map((item) => (
                  <button
                    key={item.type}
                    className="group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleDownloadPDF(item.ref, item.type)}
                    disabled={generatingFor === item.type}
                  >
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm transition-all hover:shadow-md">
                      <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-red-100 transition">
                        <Download className="text-red-500" size={14} />
                      </div>
                      <h4 className="text-xs font-semibold text-gray-800">
                        {generatingFor === item.type
                          ? "Generating..."
                          : item.label}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Download PDF
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
