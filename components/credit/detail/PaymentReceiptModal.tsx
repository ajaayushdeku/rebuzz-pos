"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Receipt,
} from "lucide-react";

import ModalShell, {
  DocumentRow,
  SectionLabel,
} from "@/components/ui/ModalShell";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { normalizePaymentMethod } from "@/lib/config/transaction";
import type { Credit, CreditPayment } from "@/services/apiCredit.client";
import { formatDateLong } from "./creditDetailHelpers";
import type {
  ReceiptBusiness,
  ReceiptCustomer,
} from "./PaymentReceiptDocument";
import {
  buildReceiptPdf,
  emailReceiptPdf,
  PaymentReceiptOffscreen,
  receiptContext,
  receiptPdfFileName,
  receiptPreviewUrl,
} from "./paymentReceiptActions";

/** Square icon button, matching the credit send modal's row actions. */
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
          ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/25 dark:text-blue-300 dark:bg-blue-400/10"
          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:hover:border-white/25 dark:hover:text-[#e8ecf4] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#9aa6bd]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * What "Send a receipt" opens, for one payment.
 *
 * Scoped to the payment that was clicked rather than to the credit: the credit
 * already has its own send modal for the invoice documents, and a customer
 * chasing a single instalment wants that instalment, not a statement.
 */
export default function PaymentReceiptModal({
  open,
  onClose,
  credit,
  payment,
  payments,
  businessProfile,
  customerProfile,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  /** The payment whose receipt this is; null while the modal is closed. */
  payment: CreditPayment | null;
  /** Every payment on the credit, for numbering and the running total. */
  payments: CreditPayment[];
  businessProfile?: ReceiptBusiness | null;
  customerProfile?: (ReceiptCustomer & { email?: string }) | null;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const docRef = useRef<HTMLDivElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const context = useMemo(
    () => (payment ? receiptContext(payments, payment) : null),
    [payments, payment],
  );

  const recipient = credit?.user?.email || customerProfile?.email;
  const busy = downloading || emailing;

  const previewUrl = () =>
    credit && payment ? receiptPreviewUrl(credit, payment) : null;

  const copyLink = async () => {
    const url = previewUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Receipt link copied");
    } catch {
      toast.error(
        "Couldn't copy the link. Open the preview and copy it from there.",
      );
    }
  };

  const openPreview = () => {
    const url = previewUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const download = async () => {
    if (!credit || !context || busy) return;
    setDownloading(true);
    try {
      const pdf = await buildReceiptPdf(docRef);
      pdf.save(receiptPdfFileName(credit, context));
    } catch (err) {
      console.error("Receipt PDF error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate the receipt",
      );
    } finally {
      setDownloading(false);
    }
  };

  const sendEmail = async () => {
    if (!credit || !context || busy) return;
    if (!recipient) {
      toast.error("No customer email found");
      return;
    }
    setEmailing(true);
    try {
      const pdf = await buildReceiptPdf(docRef);
      const message = await emailReceiptPdf({
        credit,
        context,
        pdf,
        recipientEmail: recipient,
        recipientName: customerProfile?.name,
      });
      toast.success(message || `Receipt sent to ${recipient}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to email the receipt",
      );
    } finally {
      setEmailing(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <PaymentReceiptOffscreen
        documentRef={docRef}
        credit={credit}
        payment={payment}
        context={context}
        businessProfile={businessProfile}
        customerProfile={customerProfile}
      />

      <ModalShell
        open={open}
        onClose={onClose}
        busy={busy}
        title="Send a receipt"
        subtitle={
          payment
            ? `${fmt(payment.paymentAmount ?? 0)} · ${formatDateLong(payment.paymentDate)}`
            : "One payment's receipt"
        }
        icon={Receipt}
        iconColor="text-blue-600 dark:text-[#7ba2e3]"
        iconBgColor="bg-blue-50 dark:bg-blue-400/10"
        footer={
          credit && payment ? (
            <button
              type="button"
              onClick={sendEmail}
              disabled={!recipient || busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending the receipt...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Send via email
                </>
              )}
            </button>
          ) : null
        }
      >
        {!credit || !payment || !context ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-gray-400 dark:text-[#9aa6bd]">
            <Loader2 size={15} className="animate-spin" />
            Loading payment
          </div>
        ) : (
          <div className="space-y-5">
            {/* What this receipt is for — the modal is opened from a list of
                near-identical rows, so it has to name the one that was
                clicked. */}
            <div>
              <SectionLabel>This receipt</SectionLabel>
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/70 dark:bg-white/5 px-3.5 py-3 dark:border-white/15">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-[#e8ecf4]">
                    Payment {context.index} of {context.total}
                  </p>
                  <p className="text-[15px] font-bold text-gray-900 dark:text-[#e8ecf4]">
                    {fmt(payment.paymentAmount ?? 0)}
                  </p>
                </div>
                <p className="mt-1 text-[12px] text-gray-500 dark:text-[#9aa6bd]">
                  {formatDateLong(payment.paymentDate)} ·{" "}
                  {normalizePaymentMethod(payment.paymentMethod)} ·{" "}
                  {(payment.dueAmount ?? 0) <= 0
                    ? "settled in full"
                    : `${fmt(payment.dueAmount ?? 0)} still due`}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <SectionLabel>Share</SectionLabel>
                <span className="pr-3 text-[11px] text-gray-400 dark:text-[#9aa6bd]">
                  Copy · Download · Open
                </span>
              </div>

              <div className="mt-2">
                <DocumentRow
                  icon={Receipt}
                  label={`Receipt #${credit.invoiceNo}-${context.index}`}
                  description="What the customer sees for this payment"
                  trailing={
                    <div className="flex shrink-0 items-center gap-1.5">
                      <RowIconButton
                        label="Copy receipt link"
                        onClick={copyLink}
                        active={copied}
                      >
                        {copied ? (
                          <Check
                            size={14}
                            className="text-emerald-600 dark:text-emerald-300"
                          />
                        ) : (
                          <Copy size={14} />
                        )}
                      </RowIconButton>

                      <RowIconButton
                        label="Download receipt PDF"
                        onClick={download}
                        disabled={busy}
                      >
                        {downloading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </RowIconButton>

                      <button
                        type="button"
                        onClick={openPreview}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 dark:bg-[#1C2A43] dark:text-[#7BA2E3] border dark:border-[#2D5284]
                    dark:hover:bg-[#2D5284] dark:hover:text-white cursor-pointer px-3 text-[12px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        <ExternalLink size={13} />
                        Preview
                      </button>
                    </div>
                  }
                />
              </div>
            </div>

            <div>
              <SectionLabel>Email goes to</SectionLabel>
              {recipient ? (
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/70 dark:bg-white/5 px-3.5 py-2.5 dark:border-white/15">
                  <Mail
                    size={14}
                    className="shrink-0 text-gray-400 dark:text-[#9aa6bd]"
                  />
                  <p className="truncate text-[13px] font-medium text-gray-800 dark:text-[#e8ecf4]">
                    {recipient}
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 dark:border-red-400/25 dark:bg-red-400/10">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-red-500 dark:text-red-300"
                  />
                  <p className="text-[12px] leading-relaxed text-red-600 dark:text-red-300">
                    This customer has no email on file. Copy, download and
                    preview still work; add an email to the customer profile to
                    send.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-gray-400 dark:text-[#9aa6bd]">
              The link shows this payment alone — its amount, method and the
              balance left afterwards.
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
