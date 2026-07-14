"use client";

import Image from "next/image";
import { RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { toJpeg } from "html-to-image";
import { Download, Monitor, Printer, Smartphone } from "lucide-react";

import businessLogo from "@/public/rebuzz.png";

import { useCurrency } from "@/providers/CurrencyContext";
import { InvoiceItemGroup } from "@/lib/types/invoice";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import type { CreditPayment } from "@/services/apiCredit.client";
import InvoiceBillTable from "./InvoiceBillTable";

// ── Types ─────────────────────────────────────────────────────────────────

interface InvoiceData {
  _id: string;
  invoice: number;
  ticketName: string;
  customerEmail: string;
  phoneNumber: string;
  grandTotal: number;
  total: number;
  taxamt?: number;
  discount?: number;
  discountByPoints?: number;
  ticketTakenBy: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemGroup[];
}

interface CustomerProfile {
  name?: string;
  loyaltyPoint?: number;
  customerPan?: string;
}

interface BusinessProfile {
  businessName?: string | null;
  address?: string | null;
  panNumber?: number | string | null;
}

type PreviewMode = "desktop" | "mobile";
type InvoiceType = "proforma" | "invoice" | "tax";

interface InvoicePreviewProps {
  type: InvoiceType;
  invoiceRef?: RefObject<HTMLDivElement | null>;
  invoice: InvoiceData;
  customerProfile?: CustomerProfile | null;
  businessProfile?: BusinessProfile | null;
  /** When provided, overrides the invoice data with paid bill data (e.g. cashier name from generatedBy) */
  billData?: Transaction | null;
  /** Credit payment history — when provided (credited invoices), a
   *  "Payments received" section is rendered after the totals. */
  payments?: CreditPayment[] | null;
  /** Renders the interactive preview chrome with a Desktop/Mobile toggle.
   *  Off by default so PDF/print/public rendering keep the raw document only. */
  withControls?: boolean;
}

// ── Invoice document (shared by both modes) ────────────────────────────────

function InvoiceContent({
  type,
  invoice,
  customerProfile,
  businessProfile,
  billData,
  payments,
  isMobile,
}: {
  type: InvoiceType;
  invoice: InvoiceData;
  customerProfile?: CustomerProfile | null;
  businessProfile?: BusinessProfile | null;
  billData?: Transaction | null;
  payments?: CreditPayment[] | null;
  isMobile: boolean;
}) {
  const { currency } = useCurrency();

  // ── Payment history (credited invoices) ─────────────────────────────────
  const paymentList = [...(payments ?? [])].sort((a, b) =>
    a.paymentDate.localeCompare(b.paymentDate),
  );
  const totalPaid = paymentList.reduce(
    (sum, p) => sum + (p.paymentAmount ?? 0),
    0,
  );
  const amountDue = Math.max(0, Number(invoice.grandTotal ?? 0) - totalPaid);
  const formatPaymentDate = (raw: string) => {
    const d = new Date(raw.replace(" ", "T"));
    return isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

  const customerName =
    customerProfile?.name ||
    invoice.ticketName ||
    invoice.customerEmail ||
    "Guest";

  const formattedDate = new Date(
    billData?.createdAt ? billData.createdAt : invoice.createdAt,
  ).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedCancelledDate = new Date(
    billData?.updatedAt ?? invoice.updatedAt,
  ).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const calculatedTaxAmount = invoice.items.reduce((groupSum, group) => {
    const itemTax = group.item.reduce(
      (sum, product) =>
        sum + (product.taxApplied ? product.taxAmount * product.quantity : 0),
      0,
    );
    return groupSum + itemTax;
  }, 0);

  const discountAmount = billData?.discount ?? invoice.discount ?? 0;
  const loyaltyRedeemedAmount = billData?.discountByPoints ?? 0;
  const taxAmount = calculatedTaxAmount;

  const isProforma = type === "proforma";
  const isTaxInvoice = type === "tax";
  const invoiceTitle = isProforma
    ? "Proforma Invoice"
    : isTaxInvoice
      ? "Tax Invoice"
      : "Invoice";

  // ── Mobile layout — centered, compact ───────────────────────────────────
  if (isMobile) {
    return (
      <div className="bg-white w-full min-h-full font-sans text-gray-900 text-sm">
        <div className="h-1.5 bg-gray-800" />

        {/* Business name hero */}
        <div className="text-center px-5 pt-6 pb-4 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            {businessProfile?.businessName || "My Business"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {invoiceTitle} #{invoice.invoice}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-3">
            {currency.symbol}
            {Number(invoice.grandTotal).toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Issued on{" "}
            {new Date(invoice.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Details */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-2.5 text-xs">
          {[
            ["Invoice number:", String(invoice.invoice)],
            [
              "Amount due:",
              `${currency.symbol}${Number(invoice.grandTotal).toFixed(2)}`,
            ],
            [
              "Payment due:",
              new Date(invoice.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            ],
            ["Bill to:", customerName],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between items-center gap-3"
            >
              <span className="text-gray-500 shrink-0">{label}</span>
              <span className="font-semibold text-gray-900 text-right truncate">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="px-5 py-4">
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <span>Items</span>
            <span>Amount</span>
          </div>
          {invoice.items.map((group, gi) =>
            group.item.map((product, pi) => (
              <div
                key={`${gi}-${pi}`}
                className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {product.productName}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {product.quantity} × {currency.symbol}
                    {product.unitPrice?.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  {currency.symbol}
                  {((product.unitPrice ?? 0) * product.quantity).toFixed(2)}
                </p>
              </div>
            )),
          )}

          {/* Totals */}
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>
                {currency.symbol}
                {Number(invoice.total).toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>
                  − {currency.symbol}
                  {discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {loyaltyRedeemedAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount by points</span>
                <span>
                  − {currency.symbol}
                  {loyaltyRedeemedAmount.toFixed(2)}
                </span>
              </div>
            )}
            {isTaxInvoice && taxAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax</span>
                <span>
                  + {currency.symbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-900">
                {billData ? "Grand Total" : "Total Payable"}
              </span>
              <span className="text-xs font-bold text-gray-900">
                {currency.symbol}
                {Number(invoice.grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payments received (credited) */}
          {paymentList.length > 0 && (
            <div className="mt-4 space-y-1.5 text-xs">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Payments received
              </p>
              {paymentList.map((p) => (
                <div key={p._id} className="flex justify-between text-gray-500">
                  <span>
                    {formatPaymentDate(p.paymentDate)} · {p.paymentMethod || "cash"}
                  </span>
                  <span className="font-medium text-gray-700">
                    {currency.symbol}
                    {(p.paymentAmount ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-900">
                  Amount Due ({currency.code || "NPR"})
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {currency.symbol}
                  {amountDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 border-t border-gray-100 pt-4 text-[10px] text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Cashier: {billData?.generatedBy || "N/A"}</span>
            {billData && (
              <span>Payment: {billData?.paymentMethod || "N/A"}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Date: {formattedDate}</span>
            {billData?.status === "refunded" && (
              <span className="text-red-500 font-medium">Cancelled</span>
            )}
          </div>
          {billData?.status === "refunded" && (
            <p className="text-red-500 font-medium">
              Cancelled: {formattedCancelledDate}
            </p>
          )}
          <p className="text-center text-gray-400 pt-3">
            All rights reserved · Rebuzz POS by Brand Builder Pvt Ltd
          </p>
        </div>
      </div>
    );
  }

  // ── Desktop layout — full A4 document (existing UI) ─────────────────────
  return (
    <div className="bg-white w-full min-h-[1123px] px-8 py-10 text-black border-[4px] border-orange-500 font-sans">
      {/* ───────────────── Header ───────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{invoiceTitle}</h1>
      </div>

      {/* ───────────────── Business Info ───────────────── */}
      <div className="flex justify-between items-start mb-10">
        <Image
          src={businessLogo}
          alt="Business Logo"
          width={120}
          height={120}
          quality={100}
          priority
          className="object-contain"
        />

        <div className="text-right">
          <h2 className="text-2xl font-bold">
            {businessProfile?.businessName || "My Business"}
          </h2>

          <p className="text-base mt-1">
            {businessProfile?.address || "Nepal"}
          </p>

          <p className="text-sm mt-1 text-black-600">
            PAN: {businessProfile?.panNumber || "609699393"}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-300 mb-6" />

      {/* ───────────────── Customer Info ───────────────── */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-1">Client Info</h3>

        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Name:</span> {customerName}
          </p>

          <p>
            <span className="font-medium">Email:</span>{" "}
            {invoice.customerEmail || "N/A"}
          </p>

          {invoice.phoneNumber && (
            <p>
              <span className="font-medium">Phone:</span> {invoice.phoneNumber}
            </p>
          )}

          <p>
            <span className="font-medium">Tax ID:</span>{" "}
            {customerProfile?.customerPan || "N/A"}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-300 mb-3" />

      {/* ───────────────── Meta Info ───────────────── */}
      <div className="flex justify-between items-center text-sm mb-3">
        <div>
          <p className="font-medium underline">{customerName}</p>
        </div>

        {billData ? (
          <>
            <p>Invoice No: {billData.invoiceNo || invoice.invoice}</p>
            <p className="mt-1">Bill No: {billData.billNo || "N/A"}</p>
          </>
        ) : (
          <div className="text-right text-gray-600">
            <p>Date: {formattedDate}</p>
          </div>
        )}
      </div>

      <div className="border-b border-gray-300 mb-3" />

      {/* ───────────────── Items Table ───────────────── */}
      <InvoiceBillTable invoices={invoice.items} />

      <div className="border-b border-gray-300 mt-3 mb-5" />

      {/* ───────────────── Totals ───────────────── */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>
          <p className="font-medium">
            {currency.symbol} {Number(invoice.total).toFixed(2)}
          </p>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-600">Discount</p>
          <p className="font-medium">
            − {currency.symbol} {discountAmount.toFixed(2) || 0}
          </p>
        </div>

        {loyaltyRedeemedAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Discount By Points</p>
            <p className="font-medium">
              − {currency.symbol} {loyaltyRedeemedAmount.toFixed(2)}
            </p>
          </div>
        )}

        {isTaxInvoice && taxAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Tax</p>
            <p className="font-medium">
              + {currency.symbol} {taxAmount.toFixed(2)}
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2  border-gray-200">
          <p className="font-bold text-base">
            {billData ? "Grand Total" : "Total Payable"}
          </p>
          <p className="font-bold text-base">
            {currency.symbol} {Number(invoice.grandTotal).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ───────────────── Payments received (credited) ───────────────── */}
      {paymentList.length > 0 && (
        <div className="mt-5 text-sm">
          <div className="space-y-1.5">
            {paymentList.map((p) => (
              <div key={p._id} className="flex justify-between text-gray-700">
                <span>
                  Payment on {formatPaymentDate(p.paymentDate)} using a{" "}
                  {p.paymentMethod || "cash"} payment:
                </span>
                <span className="font-medium">
                  {currency.symbol} {(p.paymentAmount ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 mt-3 border-t border-gray-300">
            <p className="font-bold text-base">
              Amount Due ({currency.code || "NPR"}):
            </p>
            <p className="font-bold text-base">
              {currency.symbol} {amountDue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* ───────────────── Footer ───────────────── */}
      <div className="border-b border-gray-300 my-6" />

      <div className="bg-gray-50 py-4 rounded-lg text-sm">
        <div className="flex justify-between items-start text-sm text-black-600">
          <div className="flex flex-col gap-2">
            <p>Cashier: {billData?.generatedBy || "N/A"}</p>
            {billData && <p>Counter: POS12</p>}

            {billData?.status === "refunded" && (
              <p className="text-red-500 font-medium">Cancelled Bill</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {billData && (
              <p>Payment Mode: {billData?.paymentMethod || "N/A"}</p>
            )}

            <p>Date: {formattedDate}</p>

            {billData?.status === "refunded" && (
              <p className="text-red-500 font-medium">
                Date: {formattedCancelledDate}
              </p>
            )}
          </div>
        </div>

        {billData && (
          <div className="flex justify-between items-start text-sm text-black-600 mt-4 gap-2">
            <div className="flex flex-col justify-between gap-2">
              <p>Current Point:</p>
              <p>Total Points:</p>
            </div>

            <div className="flex flex-col  gap-2 items-end">
              <span> {billData?.currentPoint || "0"}</span>
              <span> {billData?.totalPoints || "0"}</span>
            </div>
          </div>
        )}

        <div className="text-center mt-10 text-xs text-gray-500">
          <p>All rights reserved : Rebuzz POS by</p>
          <p className="mt-1 font-medium">Brand Builder Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
}

// ── Preview mode toggle ─────────────────────────────────────────────────────

const PREVIEW_MODES: {
  label: string;
  value: PreviewMode;
  icon: typeof Monitor;
}[] = [
  { label: "Desktop", value: "desktop", icon: Monitor },
  { label: "Mobile", value: "mobile", icon: Smartphone },
];

// ── Main InvoicePreview ─────────────────────────────────────────────────────

export default function InvoicePreview({
  type,
  invoiceRef,
  invoice,
  customerProfile,
  businessProfile,
  billData,
  payments,
  withControls = false,
}: InvoicePreviewProps) {
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const isMobile = previewMode === "mobile";

  // Off-screen A4 desktop document of the CURRENT type — used for print/export
  // so the output is always the proper document regardless of the mobile toggle.
  const docRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const content = (
    <InvoiceContent
      type={type}
      invoice={invoice}
      customerProfile={customerProfile}
      businessProfile={businessProfile}
      billData={billData}
      payments={payments}
      isMobile={withControls ? isMobile : false}
    />
  );

  // A4 desktop document reused as the off-screen export source and the print body.
  const printableDocument = (
    <InvoiceContent
      type={type}
      invoice={invoice}
      customerProfile={customerProfile}
      businessProfile={businessProfile}
      billData={billData}
      payments={payments}
      isMobile={false}
    />
  );

  // Build a compressed, multi-page A4 PDF from the off-screen document.
  const handleExportPdf = async () => {
    if (!docRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toJpeg(docRef.current, {
        cacheBust: true,
        quality: 0.7,
        pixelRatio: 1.5,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(
        dataUrl,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          dataUrl,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${invoice.invoice}-${type}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => setPrinting(true);

  // Once the print document is rendered, open the browser print dialog.
  useEffect(() => {
    if (!printing) return;
    const timer = setTimeout(() => window.print(), 300);
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  // Action buttons — shown only in the interactive preview (public preview
  // pages), acting on the current invoice type.
  const actionButtons = withControls && (
    <div className="flex items-center justify-center bg-g gap-3 py-4 print:hidden">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
      >
        <Printer size={16} />
        <span className="hidden lg:inline-block"> Print</span>
      </button>
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Download size={16} />
        <span className="hidden lg:inline-block">
          {" "}
          {isExporting ? "Exporting..." : "Export as PDF"}
        </span>
      </button>
    </div>
  );

  // Off-screen A4 export source + isolated print body (portaled to <body> so the
  // global print CSS shows only the invoice).
  const printSupport = withControls && (
    <>
      <div aria-hidden className="absolute -left-[99999px] top-0">
        <div ref={docRef} className="bg-white w-[794px]">
          {printableDocument}
        </div>
      </div>
      {printing &&
        createPortal(
          <div className="invoice-print-root">
            <div className="bg-white w-[794px] mx-auto">
              {printableDocument}
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  // Raw document — used for PDF export, screenshots, printing and public pages.
  if (!withControls) {
    return (
      <div ref={invoiceRef} className="bg-white w-[794px] mx-auto">
        {content}
      </div>
    );
  }

  // Interactive preview with a Desktop / Mobile toggle.
  return (
    <div className=" w-full bg-white border border-gray-200 overflow-hidden shadow-sm">
      {printSupport}

      {/* Preview header */}
      <div className=" relative bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-2 print:hidden">
        <div className="flex flex-col items-left gap-1 text-[11px] text-gray-400">
          <span className="font-medium text-gray-500">PREVIEW MODE</span>

          <span className="hidden lg:inline-block">
            You are previewing how your customer will see this invoice.
          </span>
        </div>

        {/* Desktop / Mobile toggle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1 shrink-0 ">
          {PREVIEW_MODES.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setPreviewMode(value)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[72px] px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                previewMode === value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              <span className="hidden lg:inline-block">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push(`/invoices/${invoice.invoice}`)}
          className="text-sm font-semibold cursor-pointer text-blue-600 hover:text-blue-700 border-[3px] border-blue-200 hover:border-blue-300 rounded-2xl px-3 py-1.5 transition-colors"
        >
          Go Back to Rebuzz
        </button>
      </div>

      {/* Preview canvas — animated width transition */}
      <div
        className="bg-gray-100/60 py-2 flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-x-auto"
        style={{ minHeight: isMobile ? "600px" : "800px" }}
      >
        {" "}
        {actionButtons}
        <div
          ref={invoiceRef}
          className="overflow-hidden shadow-lg transition-all duration-300 ease-in-out"
          style={{
            width: isMobile ? "375px" : "794px",
            borderRadius: isMobile ? "24px" : "4px",
            border: isMobile ? "8px solid #1f2937" : "1px solid #e5e7eb",
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
