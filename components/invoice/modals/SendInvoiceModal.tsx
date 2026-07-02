"use client";

import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Link as LinkIcon, Mail } from "lucide-react";

import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useInvoiceDocumentData } from "./useInvoiceTicket";

type InvoiceType = "proforma" | "invoice" | "tax";

/** Maps the UI invoice type to the backend `billType` value. */
const BILL_TYPE: Record<InvoiceType, "proforma" | "invoice" | "tax_invoice"> = {
  proforma: "proforma",
  invoice: "invoice",
  tax: "tax_invoice",
};

interface SendInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
}

const LABELS: Record<InvoiceType, string> = {
  proforma: "Proforma Invoice",
  invoice: "Invoice",
  tax: "Tax Invoice",
};

export default function SendInvoiceModal({
  open,
  onClose,
  invoiceNo,
}: SendInvoiceModalProps) {
  const { invoice, customerProfile, business, billData } =
    useInvoiceDocumentData(invoiceNo, open);

  const proformaRef = useRef<HTMLDivElement | null>(null);
  const regularRef = useRef<HTMLDivElement | null>(null);
  const taxRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] =
    useState<InvoiceType>("proforma");

  const refMap = {
    proforma: proformaRef,
    invoice: regularRef,
    tax: taxRef,
  } as const;

  // Render an off-screen invoice preview into a multi-page A4 jsPDF instance.
  const buildPdf = async (
    ref: React.RefObject<HTMLDivElement | null>,
  ): Promise<jsPDF | null> => {
    if (!ref.current) return null;
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
    return pdf;
  };

  const handleDownloadPDF = async (
    ref: React.RefObject<HTMLDivElement | null>,
    suffix: string,
  ) => {
    if (!ref.current || !invoice) return;
    try {
      setGeneratingFor(suffix);
      const pdf = await buildPdf(ref);
      if (!pdf) return;
      pdf.save(`Invoice-${invoice.invoice}-${suffix}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyPublicLinkForType = (type: InvoiceType) => {
    if (!invoice) return;
    const segment =
      type === "proforma"
        ? "proforma"
        : type === "invoice"
          ? "invoice"
          : "tax-invoice";
    const url = `${window.location.origin}/preview/${segment}/${invoice.invoice}`;
    navigator.clipboard.writeText(url);
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} link copied!`,
    );
  };

  // Generate the bill PDF and email it via the backend (throws on failure so
  // callers can aggregate results, e.g. "Send All 3").
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

    const pdf = await buildPdf(ref);
    if (!pdf) throw new Error("Failed to generate PDF");

    // data:application/pdf;base64,... — the backend strips the prefix.
    const pdfBase64 = pdf.output("datauristring");
    const fileName = `${type === "tax" ? "tax-invoice" : type}-${invoice.invoice}.pdf`;

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

  if (!open || !mounted) return null;

  const recipient = customerProfile?.email || invoice?.customerEmail;

  return createPortal(
    <>
      {/* ── Off-screen previews used for PDF export & email screenshots ── */}
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
          className="relative w-full max-w-2xl px-2 py-1 rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-3.5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Send Invoice</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Share, download, or email invoice documents
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* ── Scrollable Content ── */}
          <div
            className="max-h-[75vh] overflow-y-auto px-5 py-4 space-y-5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {!invoice ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                Loading invoice...
              </div>
            ) : (
              <>
                {/* ── Copy Links ── */}
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Copy Invoice Links
                    </h3>
                    <p className="text-xs text-gray-500">
                      Share invoice links instantly
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { label: "Proforma", type: "proforma" },
                        { label: "Invoice", type: "invoice" },
                        { label: "Tax Invoice", type: "tax" },
                      ] as { label: string; type: InvoiceType }[]
                    ).map((item) => (
                      <button
                        key={item.type}
                        className="group cursor-pointer"
                        onClick={() => copyPublicLinkForType(item.type)}
                      >
                        <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm transition-all hover:shadow-md">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition">
                            <LinkIcon className="text-blue-600" size={14} />
                          </div>
                          <h4 className="text-xs font-semibold text-gray-800">
                            {item.label}
                          </h4>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            Copy link
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Download PDFs ── */}
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Download PDFs
                    </h3>
                    <p className="text-xs text-gray-500">
                      Generate printable invoice documents
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          label: "Proforma",
                          type: "proforma",
                          ref: proformaRef,
                        },
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
                        className="group cursor-pointer"
                        onClick={() => handleDownloadPDF(item.ref, item.type)}
                        disabled={generatingFor === item.type}
                      >
                        <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm transition-all hover:shadow-md">
                          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-red-100 transition">
                            <FileText className="text-red-500" size={14} />
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
                </div>

                {/* ── Send Email Section ── */}
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shadow-sm">
                      <Mail size={18} />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">
                      Send Invoice by Email
                    </h3>
                    <p className="mt-1 max-w-md text-xs text-gray-500">
                      Select which invoice format you want to send to{" "}
                      <span className="font-semibold text-gray-700">
                        {recipient || "customer"}
                      </span>
                      .
                    </p>
                  </div>

                  {/* ── Invoice Type Selector ── */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(
                      [
                        { label: "Proforma", value: "proforma" },
                        { label: "Invoice", value: "invoice" },
                        { label: "Tax Invoice", value: "tax" },
                      ] as { label: string; value: InvoiceType }[]
                    ).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedInvoiceType(item.value)}
                        className={`rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                          selectedInvoiceType === item.value
                            ? "border-blue-600 bg-blue-600 text-white shadow"
                            : "border-gray-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold">
                              {item.label}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                selectedInvoiceType === item.value
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              Send this
                            </p>
                          </div>
                          <div
                            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedInvoiceType === item.value
                                ? "border-white bg-white"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedInvoiceType === item.value && (
                              <div className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* ── Recipient info ── */}
                  {recipient ? (
                    <div className="mt-3 flex items-center gap-2 bg-white rounded-lg border border-blue-100 px-3 py-2">
                      <Mail size={12} className="text-blue-500 shrink-0" />
                      <p className="text-xs text-gray-600">
                        To:{" "}
                        <span className="font-semibold text-gray-800">
                          {recipient}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg border border-red-100 px-3 py-2">
                      <p className="text-xs text-red-600">
                        No customer email found
                      </p>
                    </div>
                  )}

                  {/* ── Action Buttons ── */}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      disabled={isSendingEmail || !recipient}
                      onClick={async () => {
                        setIsSendingEmail(true);
                        try {
                          await handleSendInvoiceByEmail(selectedInvoiceType);
                        } catch (err) {
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : "Failed to email bill",
                          );
                        } finally {
                          setIsSendingEmail(false);
                        }
                      }}
                    >
                      {isSendingEmail ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-white"
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
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={13} />
                          Send {LABELS[selectedInvoiceType]}
                        </>
                      )}
                    </button>

                    <button
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSendingEmail || !recipient}
                      onClick={async () => {
                        setIsSendingEmail(true);
                        for (const type of [
                          "proforma",
                          "invoice",
                          "tax",
                        ] as InvoiceType[]) {
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
                      }}
                    >
                      Send All 3
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
