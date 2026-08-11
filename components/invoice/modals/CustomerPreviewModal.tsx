"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import {
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

import ModalShell, { DocumentRow } from "@/components/ui/ModalShell";
import {
  INVOICE_TYPES,
  SHORT_LABELS,
  DESCRIPTIONS,
  segmentFor,
  type InvoiceType,
} from "@/components/invoice/InvoiceDocuments";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

interface CustomerPreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

export default function CustomerPreviewModal({
  open,
  onClose,
  invoiceNo,
}: CustomerPreviewModalProps) {
  const { invoice } = useInvoiceDocumentData(invoiceNo, open);
  const [copied, setCopied] = useState<InvoiceType | null>(null);

  const buildUrl = (type: InvoiceType): string | null => {
    if (!invoice) return null;
    return `${window.location.origin}/preview/${segmentFor(type)}/${invoice.invoice}`;
  };

  const handleCopy = async (type: InvoiceType, label: string) => {
    const url = buildUrl(type);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      setTimeout(() => setCopied((c) => (c === type ? null : c)), 1800);
      toast.success(`${label} link copied`);
    } catch {
      toast.error(
        "Couldn't copy the link. Copy it from the opened tab instead.",
      );
    }
  };

  const handleOpen = (type: InvoiceType) => {
    const url = buildUrl(type);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Customer preview"
      subtitle={
        invoice?.invoice != null
          ? `Invoice #${invoice.invoice} · public share links`
          : "Public share links"
      }
      icon={LinkIcon}
    >
      {!invoice ? (
        <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Loading invoice
        </div>
      ) : (
        <div className="space-y-2">
          {INVOICE_TYPES.map((type) => (
            <DocumentRow
              key={type}
              icon={LinkIcon}
              label={SHORT_LABELS[type]}
              description={DESCRIPTIONS[type]}
              trailing={
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(type, SHORT_LABELS[type])}
                    aria-label={`Copy ${SHORT_LABELS[type]} link`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {copied === type ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpen(type)}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <ExternalLink size={13} />
                    Open
                  </button>
                </div>
              }
            />
          ))}

          <p className="pt-1 text-[11px] leading-relaxed text-gray-400">
            Anyone with these links can view the document — no sign-in needed.
          </p>
        </div>
      )}
    </ModalShell>
  );
}
