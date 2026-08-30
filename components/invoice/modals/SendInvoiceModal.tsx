"use client";

import toast from "react-hot-toast";
import { useRef, useState } from "react";
import {
  Download,
  FileText,
  Link as LinkIcon,
  Mail,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import ModalShell, {
  DocumentRow,
  OffscreenLayer,
  SectionLabel,
} from "@/components/ui/ModalShell";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import {
  INVOICE_TYPES,
  LABELS,
  SHORT_LABELS,
  DESCRIPTIONS,
  BILL_TYPE,
  segmentFor,
  fileStemFor,
  type InvoiceType,
} from "@/components/invoice/InvoiceDocuments";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

interface SendInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
  /** Whether the business PAN is printed on the documents. */
  showPan?: boolean;
}

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

export default function SendInvoiceModal({
  open,
  onClose,
  invoiceNo,
  showPan = true,
}: SendInvoiceModalProps) {
  const { invoice, customerProfile, business, billData, payments, credit } =
    useInvoiceDocumentData(invoiceNo, open);

  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);

  const [copied, setCopied] = useState<InvoiceType | null>(null);
  const [downloadingFor, setDownloadingFor] = useState<InvoiceType | null>(
    null,
  );
  const [emailingFor, setEmailingFor] = useState<InvoiceType | "all" | null>(
    null,
  );

  const refMap = {
    proforma: proformaRef,
    invoice: regularRef,
    tax: taxRef,
  } as const;

  const recipient = customerProfile?.email || invoice?.customerEmail;
  const busy = !!downloadingFor || !!emailingFor;

  // ── Copy link ─────────────────────────────────────────────────────────────
  const copyPublicLinkForType = async (type: InvoiceType) => {
    if (!invoice) return;
    const url = `${window.location.origin}/preview/${segmentFor(type)}/${invoice.invoice}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      setTimeout(() => setCopied((c) => (c === type ? null : c)), 1800);
      toast.success(`${SHORT_LABELS[type]} link copied`);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownloadPDF = async (type: InvoiceType) => {
    if (!invoice || busy) return;
    try {
      setDownloadingFor(type);
      const pdf = await buildInvoicePdf(refMap[type]);
      if (!pdf) throw new Error("Invoice preview not ready");
      pdf.save(`Invoice-${invoice.invoice}-${fileStemFor(type)}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingFor(null);
    }
  };

  // ── Email ─────────────────────────────────────────────────────────────────
  // Throws on failure so callers can aggregate results, e.g. "Email all three".
  const sendInvoiceByEmail = async (type: InvoiceType) => {
    const ref = refMap[type];
    if (!ref.current || !invoice) {
      throw new Error("Invoice preview not ready");
    }
    const recipientEmail = customerProfile?.email || invoice?.customerEmail;
    if (!recipientEmail) {
      throw new Error("No customer email found");
    }

    // Wait a tick to ensure the off-screen preview is painted.
    await new Promise((r) => setTimeout(r, 200));

    const pdf = await buildInvoicePdf(ref);
    if (!pdf) throw new Error("Failed to generate PDF");

    // data:application/pdf;base64,... — the backend strips the prefix.
    const pdfBase64 = pdf.output("datauristring");
    const fileName = `${fileStemFor(type)}-${invoice.invoice}.pdf`;

    const res = await fetch("/api/bills/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billType: BILL_TYPE[type],
        pdfBase64,
        recipientEmail,
        recipientName: customerProfile?.name || invoice.ticketName || undefined,
        fileName,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to email bill");
    }

    toast.success(data.message || `${LABELS[type]} sent to ${recipientEmail}`);
  };

  const emailOne = async (type: InvoiceType) => {
    if (busy) return;
    setEmailingFor(type);
    try {
      await sendInvoiceByEmail(type);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to email bill");
    } finally {
      setEmailingFor(null);
    }
  };

  const emailAll = async () => {
    if (busy) return;
    setEmailingFor("all");
    for (const type of INVOICE_TYPES) {
      try {
        await sendInvoiceByEmail(type);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `${LABELS[type]}: ${err.message}`
            : `Failed to email ${LABELS[type]}`,
        );
      }
    }
    setEmailingFor(null);
  };

  if (!open) return null;

  return (
    <>
      {/* Off-screen previews used for PDF export & email attachments. */}
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
              showPan={showPan}
              billData={billData}
              payments={payments}
              // credit={credit}
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
        busy={busy}
        title="Send invoice"
        subtitle={
          invoice?.invoice != null
            ? `Invoice #${invoice.invoice} · copy, download or email`
            : "Copy, download or email"
        }
        icon={FileText}
        footer={
          invoice ? (
            <button
              type="button"
              onClick={emailAll}
              disabled={!recipient || busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailingFor === "all" ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Emailing All Three Invoices...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Email All Three Invoices
                </>
              )}
            </button>
          ) : null
        }
      >
        {!invoice ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400">
            <Loader2 size={15} className="animate-spin" />
            Loading invoice
          </div>
        ) : (
          <div className="space-y-5">
            {/* Documents + per-row actions */}
            <div>
              <div className="flex items-baseline justify-between">
                <SectionLabel>Documents</SectionLabel>
                <span className="text-[11px] text-gray-400 pr-3">
                  Copy · Download · Email
                </span>
              </div>

              <div className="mt-2 space-y-2">
                {INVOICE_TYPES.map((type) => (
                  <DocumentRow
                    key={type}
                    icon={FileText}
                    label={SHORT_LABELS[type]}
                    description={DESCRIPTIONS[type]}
                    trailing={
                      <div className="flex shrink-0 items-center gap-1.5">
                        <RowIconButton
                          label={`Copy ${SHORT_LABELS[type]} link`}
                          onClick={() => copyPublicLinkForType(type)}
                          active={copied === type}
                        >
                          {copied === type ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <LinkIcon size={14} />
                          )}
                        </RowIconButton>

                        <RowIconButton
                          label={`Download ${SHORT_LABELS[type]} PDF`}
                          onClick={() => handleDownloadPDF(type)}
                          disabled={busy}
                        >
                          {downloadingFor === type ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </RowIconButton>

                        <RowIconButton
                          label={`Email ${SHORT_LABELS[type]}`}
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

            {/* Recipient */}
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
              Anyone with a copied link can view that document — no sign-in
              needed.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
