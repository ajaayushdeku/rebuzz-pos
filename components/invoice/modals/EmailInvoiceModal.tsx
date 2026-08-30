"use client";

import toast from "react-hot-toast";
import { useRef, useState } from "react";
import { Mail, FileText, Loader2, AlertCircle } from "lucide-react";

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
  fileStemFor,
  type InvoiceType,
} from "@/components/invoice/InvoiceDocuments";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

interface EmailInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
  /** Whether the business PAN is printed on the documents. */
  showPan?: boolean;
}

export default function EmailInvoiceModal({
  open,
  onClose,
  invoiceNo,
  showPan = true,
}: EmailInvoiceModalProps) {
  const { invoice, customerProfile, business, billData, payments, credit } =
    useInvoiceDocumentData(invoiceNo, open);

  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] =
    useState<InvoiceType>("proforma");

  const refMap = {
    proforma: proformaRef,
    invoice: regularRef,
    tax: taxRef,
  } as const;

  const recipient = customerProfile?.email || invoice?.customerEmail;

  // Generate the bill PDF and email it via the backend (throws on failure so
  // callers can aggregate results, e.g. "Send all three").
  const handleSendInvoiceByEmail = async (type: InvoiceType) => {
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

  const sendOne = async () => {
    setIsSendingEmail(true);
    try {
      await handleSendInvoiceByEmail(selectedInvoiceType);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to email bill");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendAll = async () => {
    setIsSendingEmail(true);
    for (const type of INVOICE_TYPES) {
      try {
        await handleSendInvoiceByEmail(type);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `${LABELS[type]}: ${err.message}`
            : `Failed to email ${LABELS[type]}`,
        );
      }
    }
    setIsSendingEmail(false);
  };

  if (!open) return null;

  const canSend = !!recipient && !!invoice && !isSendingEmail;

  return (
    <>
      {/* Off-screen previews used to render the PDFs. */}
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
        busy={isSendingEmail}
        title="Email invoice"
        subtitle={
          invoice?.invoice != null
            ? `Invoice #${invoice.invoice}`
            : "Send a PDF to the customer"
        }
        icon={Mail}
        footer={
          invoice ? (
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
                onClick={sendOne}
                disabled={!canSend}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingEmail ? (
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
                    Sending
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    Send {SHORT_LABELS[selectedInvoiceType]}
                  </>
                )}
              </button>
            </div>
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
            {/* Recipient */}
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
                    profile to send the invoice.
                  </p>
                </div>
              )}
            </div>

            {/* Document picker */}
            <div>
              <SectionLabel>Document</SectionLabel>
              <div role="radiogroup" className="mt-2 space-y-2">
                {INVOICE_TYPES.map((type) => (
                  <DocumentRow
                    key={type}
                    icon={FileText}
                    label={SHORT_LABELS[type]}
                    description={DESCRIPTIONS[type]}
                    selected={selectedInvoiceType === type}
                    onSelect={() => setSelectedInvoiceType(type)}
                    disabled={isSendingEmail}
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
