"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link as LinkIcon, ExternalLink, Copy } from "lucide-react";

import { useInvoiceDocumentData } from "./useInvoiceTicket";

type InvoiceType = "proforma" | "invoice" | "tax";

interface CustomerPreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

/** Public preview route segment for each invoice type. */
const segmentFor = (type: InvoiceType): string =>
  type === "proforma" ? "proforma" : type === "invoice" ? "invoice" : "tax-invoice";

export default function CustomerPreviewModal({
  open,
  onClose,
  invoiceNo,
}: CustomerPreviewModalProps) {
  const { invoice } = useInvoiceDocumentData(invoiceNo, open);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const buildUrl = (type: InvoiceType): string | null => {
    if (!invoice) return null;
    return `${window.location.origin}/preview/${segmentFor(type)}/${invoice.invoice}`;
  };

  const handleCopy = (type: InvoiceType, label: string) => {
    const url = buildUrl(type);
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success(`${label} link copied!`);
  };

  const handleOpen = (type: InvoiceType) => {
    const url = buildUrl(type);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-indigo-100 px-5 py-3.5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Customer Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Open or copy the public invoice link to share with the customer
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
                  { label: "Proforma", type: "proforma" },
                  { label: "Invoice", type: "invoice" },
                  { label: "Tax Invoice", type: "tax" },
                ] as { label: string; type: InvoiceType }[]
              ).map((item) => (
                <div
                  key={item.type}
                  className="rounded-xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/50 p-3 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                    <LinkIcon className="text-indigo-600" size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800 text-center">
                    {item.label}
                  </h4>

                  <div className="mt-2.5 flex flex-col gap-1.5">
                    <button
                      onClick={() => handleOpen(item.type)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-2 py-1.5 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Open
                    </button>
                    <button
                      onClick={() => handleCopy(item.type, item.label)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-semibold px-2 py-1.5 transition-colors"
                    >
                      <Copy size={12} />
                      Copy link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
