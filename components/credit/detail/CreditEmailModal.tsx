"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, FileText, Loader2, Mail } from "lucide-react";

import ModalShell, {
  DocumentRow,
  SectionLabel,
} from "@/components/ui/ModalShell";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import {
  buildCreditPdf,
  CreditDocumentsOffscreen,
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

/**
 * Emails the credit's own document to the customer.
 *
 * The invoice `EmailInvoiceModal` attaches a PDF of `InvoicePreview`, which is
 * the ticket — so a credited invoice was reaching the customer showing the
 * original bill rather than what they still owe. This attaches the same
 * document the credit page previews, prints and exports.
 */
export default function CreditEmailModal({
  open,
  onClose,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
  billData,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: (CreditDocumentCustomer & { email?: string }) | null;
  billData?: Transaction | null;
}) {
  const refs = useCreditDocumentRefs();

  const [isSending, setIsSending] = useState(false);
  const [selectedType, setSelectedType] =
    useState<CreditDocumentType>("invoice");

  const recipient = credit?.user?.email || customerProfile?.email;

  /** Throws on failure so "Send all three" can report each one separately. */
  const sendOneType = async (type: CreditDocumentType) => {
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

  const sendSelected = async () => {
    setIsSending(true);
    try {
      await sendOneType(selectedType);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to email the credit",
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendAll = async () => {
    setIsSending(true);
    for (const type of CREDIT_DOCUMENT_TYPES) {
      try {
        await sendOneType(type);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `${CREDIT_DOC_LABELS[type]}: ${err.message}`
            : `Failed to email ${CREDIT_DOC_LABELS[type]}`,
        );
      }
    }
    setIsSending(false);
  };

  if (!open) return null;

  const canSend = !!recipient && !!credit && !isSending;

  return (
    <>
      <CreditDocumentsOffscreen
        refs={refs}
        credit={credit}
        items={items}
        payments={payments}
        businessProfile={businessProfile}
        customerProfile={customerProfile}
        billData={billData}
      />

      <ModalShell
        open={open}
        onClose={onClose}
        busy={isSending}
        title="Email credit invoice"
        subtitle={
          credit ? `Credit #${credit.invoiceNo}` : "Send a PDF to the customer"
        }
        icon={Mail}
        footer={
          credit ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={sendAll}
                disabled={!canSend}
                className="rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send all three
              </button>
              <button
                type="button"
                onClick={sendSelected}
                disabled={!canSend}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    Send {CREDIT_DOC_LABELS[selectedType]}
                  </>
                )}
              </button>
            </div>
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
              <SectionLabel>Sending to</SectionLabel>
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
                    This customer has no email on file. Add one to the customer
                    profile to send the credit.
                  </p>
                </div>
              )}
            </div>

            <div>
              <SectionLabel>Document</SectionLabel>
              <div role="radiogroup" className="mt-2 space-y-2">
                {CREDIT_DOCUMENT_TYPES.map((type) => (
                  <DocumentRow
                    key={type}
                    icon={FileText}
                    label={CREDIT_DOC_LABELS[type]}
                    description={CREDIT_DOC_DESCRIPTIONS[type]}
                    selected={selectedType === type}
                    onSelect={() => setSelectedType(type)}
                    disabled={isSending}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </ModalShell>
    </>
  );
}
