"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

type InvoiceType = "proforma" | "invoice" | "tax";

interface PrintInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

const OPTIONS: { label: string; type: InvoiceType }[] = [
  {
    label: "Proforma",
    type: "proforma",
  },
  {
    label: "Invoice",
    type: "invoice",
  },
  {
    label: "Tax Invoice",
    type: "tax",
  },
];

export default function PrintInvoiceModal({
  open,
  onClose,
  invoiceNo,
}: PrintInvoiceModalProps) {
  const { invoice, customerProfile, business, billData } =
    useInvoiceDocumentData(invoiceNo, open);

  const [mounted, setMounted] = useState(false);
  const [printType, setPrintType] = useState<InvoiceType | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const handlePrint = (type: InvoiceType) => {
    if (!invoice) return;
    // Render the chosen preview into the print root; the effect below opens
    // the browser print dialog once it has painted.
    setGeneratingFor(type);
    setPrintType(type);
  };

  // Once a format is chosen and its preview is rendered off-screen, open the
  // browser print dialog; clean up after the user finishes printing.
  useEffect(() => {
    if (!printType || !invoice) return;
    const timer = setTimeout(() => window.print(), 300);
    const handleAfterPrint = () => {
      setPrintType(null);
      setGeneratingFor(null);
      onClose();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printType, invoice, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      {/* Printable content — hidden on screen, isolated for print via CSS. */}
      {printType && invoice && (
        <div className="invoice-print-root">
          <InvoicePreview
            type={printType}
            invoice={invoice}
            customerProfile={customerProfile}
            businessProfile={business}
            billData={billData}
          />
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Print Invoice</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose which invoice format to print
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
            ) : printType && generatingFor ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                Opening print dialog...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {OPTIONS.map((item) => (
                  <button
                    key={item.type}
                    className="group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handlePrint(item.type)}
                    disabled={generatingFor === item.type}
                  >
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm transition-all hover:shadow-md">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition">
                        <Printer className="text-blue-500" size={14} />
                      </div>
                      <h4 className="text-xs font-semibold text-gray-800">
                        {generatingFor === item.type
                          ? "Generating..."
                          : item.label}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Print document
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
