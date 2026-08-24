"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  Download,
  FileText,
  Link as LinkIcon,
  Loader2,
  Mail,
} from "lucide-react";

import ModalShell, {
  DocumentRow,
  SectionLabel,
} from "@/components/ui/ModalShell";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import {
  buildCreditPdf,
  CreditDocumentsOffscreen,
  creditPdfFileName,
  creditPreviewUrl,
  emailCreditPdf,
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

/** Square icon button used for the per-row actions. */
function RowIconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-600"
          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Copy, download or email the credit's own documents.
 *
 * The credit page's Send step used the invoice `SendInvoiceModal`, which
 * attaches a PDF of the original ticket and copies `/preview/{invoiceNo}`
 * links — so a customer chasing a credit received the bill as first raised.
 * Everything here is the credit's document and the credit's share links.
 */
export default function CreditSendModal({
  open,
  onClose,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: (CreditDocumentCustomer & { email?: string }) | null;
}) {
  const refs = useCreditDocumentRefs();

  const [copied, setCopied] = useState<CreditDocumentType | null>(null);
  const [downloadingFor, setDownloadingFor] =
    useState<CreditDocumentType | null>(null);
  const [emailingFor, setEmailingFor] = useState<
    CreditDocumentType | "all" | null
  >(null);

  const recipient = credit?.user?.email || customerProfile?.email;
  const busy = !!downloadingFor || !!emailingFor;

  const copyLink = async (type: CreditDocumentType) => {
    if (!credit) return;
    try {
      await navigator.clipboard.writeText(creditPreviewUrl(credit, type));
      setCopied(type);
      setTimeout(() => setCopied((c) => (c === type ? null : c)), 1800);
      toast.success(`${CREDIT_DOC_LABELS[type]} link copied`);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const download = async (type: CreditDocumentType) => {
    if (!credit || busy) return;
    setDownloadingFor(type);
    try {
      const pdf = await buildCreditPdf(refs[type]);
      pdf.save(creditPdfFileName(credit, type));
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingFor(null);
    }
  };

  /** Throws so "Email all three" can report each document separately. */
  const sendOne = async (type: CreditDocumentType) => {
    if (!credit) throw new Error("Credit not loaded");
    if (!recipient) throw new Error("No customer email found");

    const pdf = await buildCreditPdf(refs[type]);
    const message = await emailCreditPdf({
      credit,
      type,
      pdf,
      recipientEmail: recipient,
    });
    toast.success(message || `${CREDIT_DOC_LABELS[type]} sent to ${recipient}`);
  };

  const emailOne = async (type: CreditDocumentType) => {
    if (busy) return;
    setEmailingFor(type);
    try {
      await sendOne(type);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to email the credit",
      );
    } finally {
      setEmailingFor(null);
    }
  };

  const emailAll = async () => {
    if (busy) return;
    setEmailingFor("all");
    for (const type of CREDIT_DOCUMENT_TYPES) {
      try {
        await sendOne(type);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `${CREDIT_DOC_LABELS[type]}: ${err.message}`
            : `Failed to email ${CREDIT_DOC_LABELS[type]}`,
        );
      }
    }
    setEmailingFor(null);
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
      />

      <ModalShell
        open={open}
        onClose={onClose}
        busy={busy}
        title="Send credit invoice"
        subtitle={
          credit
            ? `Credit #${credit.invoiceNo} · copy, download or email`
            : "Copy, download or email"
        }
        icon={FileText}
        footer={
          credit ? (
            <button
              type="button"
              onClick={emailAll}
              disabled={!recipient || busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailingFor === "all" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Emailing all three documents...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Email all three documents
                </>
              )}
            </button>
          ) : null
        }
      >
        {!credit ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading credit
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <SectionLabel>Documents</SectionLabel>
                <span className="text-[11px] text-gray-400 pr-3">
                  Copy · Download · Email
                </span>
              </div>

              <div className="mt-2 space-y-2">
                {CREDIT_DOCUMENT_TYPES.map((type) => (
                  <DocumentRow
                    key={type}
                    icon={FileText}
                    label={CREDIT_DOC_LABELS[type]}
                    description={CREDIT_DOC_DESCRIPTIONS[type]}
                    trailing={
                      <div className="flex shrink-0 items-center gap-1.5">
                        <RowIconButton
                          label={`Copy ${CREDIT_DOC_LABELS[type]} link`}
                          onClick={() => copyLink(type)}
                          active={copied === type}
                        >
                          {copied === type ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <LinkIcon size={14} />
                          )}
                        </RowIconButton>

                        <RowIconButton
                          label={`Download ${CREDIT_DOC_LABELS[type]} PDF`}
                          onClick={() => download(type)}
                          disabled={busy}
                        >
                          {downloadingFor === type ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </RowIconButton>

                        <RowIconButton
                          label={`Email ${CREDIT_DOC_LABELS[type]}`}
                          onClick={() => emailOne(type)}
                          disabled={busy || !recipient}
                        >
                          {emailingFor === type || emailingFor === "all" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Mail size={14} />
                          )}
                        </RowIconButton>
                      </div>
                    }
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Emails go to</SectionLabel>
              {recipient ? (
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5">
                  <Mail size={14} className="shrink-0 text-gray-400" />
                  <p className="truncate text-[13px] font-medium text-gray-800">
                    {recipient}
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                  <p className="text-[12px] leading-relaxed text-red-600">
                    This customer has no email on file. Copy and download still
                    work; add an email to the customer profile to send.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-gray-400">
              Each link shows the credit with its payments and outstanding due.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
