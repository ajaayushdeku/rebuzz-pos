"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Check,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

import ModalShell, { DocumentRow } from "@/components/ui/ModalShell";
import type { Credit } from "@/services/apiCredit.client";
import {
  CREDIT_DOCUMENT_TYPES,
  CREDIT_DOC_DESCRIPTIONS,
  CREDIT_DOC_LABELS,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

/** Route segment for each credit document under /preview/credit. */
const segmentFor = (type: CreditDocumentType): string =>
  type === "tax" ? "tax-invoice" : type;

/**
 * Share links for the credit's customer-facing documents.
 *
 * The links point at `/preview/credit/…/{creditId}` — keyed by the credit, so
 * what the customer opens shows the current dues rather than the ticket the
 * credit was raised from.
 */
export default function CreditCustomerPreviewModal({
  open,
  onClose,
  credit,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
}) {
  const [copied, setCopied] = useState<CreditDocumentType | null>(null);

  const buildUrl = (type: CreditDocumentType): string | null => {
    if (!credit) return null;
    return `${window.location.origin}/preview/credit/${segmentFor(type)}/${credit._id}`;
  };

  const handleCopy = async (type: CreditDocumentType) => {
    const url = buildUrl(type);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      setTimeout(() => setCopied((c) => (c === type ? null : c)), 1800);
      toast.success(`${CREDIT_DOC_LABELS[type]} link copied`);
    } catch {
      toast.error(
        "Couldn't copy the link. Copy it from the opened tab instead.",
      );
    }
  };

  const handleOpen = (type: CreditDocumentType) => {
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
        credit ? `Credit #${credit.invoiceNo} · share links` : "Share links"
      }
      icon={LinkIcon}
    >
      {!credit ? (
        <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Loading credit
        </div>
      ) : (
        <div className="space-y-2">
          {CREDIT_DOCUMENT_TYPES.map((type) => (
            <DocumentRow
              key={type}
              icon={LinkIcon}
              label={CREDIT_DOC_LABELS[type]}
              description={CREDIT_DOC_DESCRIPTIONS[type]}
              trailing={
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(type)}
                    aria-label={`Copy ${CREDIT_DOC_LABELS[type]} link`}
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
            These links show the credit as the customer sees it, with its
            payments and outstanding due.
          </p>
        </div>
      )}
    </ModalShell>
  );
}
