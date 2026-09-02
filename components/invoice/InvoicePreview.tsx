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
import { parseNepalTime } from "@/lib/mappers/transaction";
import {
  normalizePaymentMethod,
  paymentModeLabel,
} from "@/lib/config/transaction";
import type { CreditPayment } from "@/services/apiCredit.client";
import InvoiceBillTable from "./InvoiceBillTable";
import PhoneFrame from "@/components/ui/PhoneFrame";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";

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
  /** Uploaded business logo URL; falls back to the bundled Rebuzz mark. */
  logo?: string | null;
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
  /** Credit details — when provided (credited invoices), uses credit.total,
   *  credit.grandTotal, and credit.taxamt instead of invoice values for accurate
   *  financial data. */
  credit?: {
    total: number;
    grandTotal: number;
    taxamt: number;
    user: {
      _id: string;
      name: string;
      phone: string;
      email: string;
    };
  } | null;
  /**
   * Whether the business PAN is printed in the header.
   *
   * On by default: a tax document that quietly dropped its registration number
   * would be the wrong thing to ship silently. The detail pages turn it off for
   * businesses that would rather not show it.
   */
  showPan?: boolean;
  /** Renders the interactive preview chrome with a Desktop/Mobile toggle.
   *  Off by default so PDF/print/public rendering keep the raw document only. */
  withControls?: boolean;
  /**
   * Lets the document fill its container instead of sitting in a fixed 794px
   * column. Printing wants this: the print root is forced to full page width,
   * so a fixed column prints narrower than the paper it is on.
   */
  fluid?: boolean;
  /**
   * Minimum height in CSS pixels. A tall sheet reads as a document on screen,
   * but for print it must not exceed one page or every short invoice gains a
   * second, near-empty one.
   */
  minHeightPx?: number;
}

// ── Invoice document (shared by both modes) ────────────────────────────────

function InvoiceContent({
  type,
  invoice,
  customerProfile,
  businessProfile,
  billData,
  payments,
  credit,
  isMobile,
  minHeightPx = 1200,
  showPan = true,
}: {
  type: InvoiceType;
  invoice: InvoiceData;
  customerProfile?: CustomerProfile | null;
  businessProfile?: BusinessProfile | null;
  billData?: Transaction | null;
  payments?: CreditPayment[] | null;
  credit?: {
    total: number;
    grandTotal: number;
    taxamt: number;
    user: {
      _id: string;
      name: string;
      phone: string;
      email: string;
    };
  } | null;
  isMobile: boolean;
  minHeightPx?: number;
  showPan?: boolean;
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

  // For credited invoices, use credit data for totals and tax
  const displayTotal = credit?.total ?? invoice.total;
  const displayGrandTotal = credit?.grandTotal ?? invoice.grandTotal;

  const amountDue = Math.max(0, Number(displayGrandTotal ?? 0) - totalPaid);
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

  // "Cash Payment" / "QR Payment". Normalising first also fixes the raw backend
  // casing ("cash", "Qr Payment") that was reaching the receipt verbatim.
  const paymentLabel = (method?: string | null) =>
    `${normalizePaymentMethod(method)} Payment`;

  const customerName =
    customerProfile?.name ||
    invoice.ticketName ||
    invoice.customerEmail ||
    "Guest";

  // Bill's paidAt needs the Nepal-timezone correction; parse it the same way as
  // Order History and format with `timeZone: "UTC"` so the result is identical on
  // every machine. Fall back to the raw createdAt when there's no bill data.
  const formattedDate = billData?.paidAt
    ? parseNepalTime(billData.paidAt).toLocaleString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date(invoice.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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

  // const calculatedTaxAmount = invoice.items.reduce((groupSum, group) => {
  //   const itemTax = group.item.reduce(
  //     (sum, product) => sum + product.taxAmount * product.quantity,
  //     0,
  //   );
  //   return groupSum + itemTax;
  // }, 0);

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
  const taxAmount = credit?.taxamt ?? invoice.taxamt ?? calculatedTaxAmount;

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
        {/* <div className="h-1.5 bg-gray-800" /> */}

        {/* Business name hero */}
        <div className="text-center px-5 pt-6 pb-4 border-b border-dashed border-gray-300">
          <p className="text-lg font-bold text-gray-900">
            {businessProfile?.businessName || "My Business"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {invoiceTitle} #{invoice.invoice}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-3">
            {/* {formatCurrencySymbol(
              Number(invoice.grandTotal),
              currency.symbol,
              currency.locale,
            )} */}
            {invoice.ticketName}
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
        <div className="px-5 py-4 border-b border-dashed border-gray-300 space-y-2.5 text-xs">
          {[
            ["Invoice number:", String(invoice.invoice)],
            [
              "Amount due:",
              `${formatCurrencySymbol(invoice.grandTotal, currency.symbol, currency.locale)}`,
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
                className="flex justify-between items-start py-2.5 border-b border-dotted border-gray-200 last:border-0"
              >
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {product.productName}
                    {product.variantItems?.name && (
                      <span className="text-gray-500">
                        {" "}
                        ({product.variantItems.name})
                      </span>
                    )}

                    {product.discounts.length !== 0 && (
                      <span className="block text-[10px] text-red-400">
                        {product.discounts.map((disc, idx) => (
                          <span key={idx} className="flex flex-col">
                            - {disc.name}:{" "}
                            {disc.type === "fixed"
                              ? formatCurrencySymbol(
                                  Number(disc.rate),
                                  currency.symbol,
                                  currency.locale,
                                )
                              : `${disc.rate}%`}{" "}
                            OFF{" "}
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {product.quantity} ×{" "}
                    {formatCurrencySymbol(
                      product.unitPrice,
                      currency.symbol,
                      currency.locale,
                    )}
                  </p>
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  {formatCurrencySymbol(
                    (product.unitPrice ?? 0) * product.quantity,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
              </div>
            )),
          )}

          {/* Totals */}
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>
                {formatCurrencySymbol(
                  Number(displayTotal),
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>
                  −{" "}
                  {formatCurrencySymbol(
                    discountAmount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            )}
            {loyaltyRedeemedAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount by points</span>
                <span>
                  −{" "}
                  {formatCurrencySymbol(
                    loyaltyRedeemedAmount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            )}
            {isTaxInvoice && taxAmount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax</span>
                <span>
                  +{" "}
                  {formatCurrencySymbol(
                    taxAmount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-300">
              <span className="text-xs font-bold text-gray-900">
                {billData ? "Grand Total" : "Total Payable"}
              </span>
              <span className="text-xs font-bold text-gray-900">
                {formatCurrencySymbol(
                  Number(displayGrandTotal),
                  currency.symbol,
                  currency.locale,
                )}
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
                  <span className="text-[12px]">
                    {formatPaymentDate(p.paymentDate)} ·{" "}
                    {paymentLabel(p.paymentMethod)}
                  </span>
                  <span className="font-medium text-gray-700">
                    -{" "}
                    {formatCurrencySymbol(
                      p.paymentAmount ?? 0,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-300">
                <span className="text-xs font-bold text-gray-900">
                  Amount Due ({currency.code || "NPR"})
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {formatCurrencySymbol(
                    amountDue,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 border-t border-dashed border-gray-300 pt-4 text-[10px] text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Cashier: {billData?.generatedBy || "N/A"}</span>
            {billData && (
              <span>
                Payment:{" "}
                {paymentModeLabel(paymentList, billData?.paymentMethod)}
              </span>
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
    <div
      // style={{ minHeight: minHeightPx }}
      // className="bg-white w-full px-10 py-10 text-black border-[3px] rounded-md border-gray-200 font-sans"
      className="bg-white w-full px-10 py-10 text-black  font-sans"
    >
      {/* ───────────────── Header ───────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold  tracking-wider ">{invoiceTitle}</h1>
      </div>

      {/* ───────────────── Business Info ───────────────── */}
      <div className="flex justify-between items-start mb-10">
        {/* Routed through next/image even for the remote logo: the optimiser
            serves it from /_next/image on this origin, so html-to-image can
            read it into the canvas for the PDF. A direct cross-origin <img>
            would taint the canvas and drop the logo from the download. */}
        <Image
          src={businessProfile?.logo || businessLogo}
          alt={`${businessProfile?.businessName || "Business"} logo`}
          width={150}
          height={150}
          quality={100}
          priority
          className="object-contain max-h-[150px] w-auto rounded-lg"
        />

        <div className="text-right  tracking-wider">
          <h2 className="text-2xl font-bold">
            {businessProfile?.businessName || "My Business"}
          </h2>

          <p className="text-base mt-1">
            {businessProfile?.address || "Nepal"}
          </p>

          {showPan ? (
            <p className="text-sm mt-1 text-black-600">
              PAN: {businessProfile?.panNumber || "609699393"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-b border-dashed border-gray-400 mb-6" />

      {/* ───────────────── Customer Info ───────────────── */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-1  tracking-wider">Client Info</h3>

        <div className="space-y-1 text-sm  tracking-wider">
          <p>
            <span className="font-medium">Name:</span> {customerName}
          </p>

          <p>
            <span className="font-medium">Email:</span>{" "}
            {invoice.customerEmail || "N/A"}
          </p>

          {invoice.phoneNumber && (
            <p>
              <span className="font-medium">Phone:</span>{" "}
              {credit?.user?.phone || invoice.phoneNumber}
            </p>
          )}

          <p>
            <span className="font-medium">Tax ID:</span>{" "}
            {customerProfile?.customerPan || "N/A"}
          </p>
        </div>
      </div>

      {/* <div className="border-b border-dashed border-gray-400 mb-3" /> */}

      {/* ───────────────── Meta Info ───────────────── */}
      <div className="flex justify-between items-center text-sm mb-3  tracking-wider">
        <div>
          <p className="font-medium underline">
            {billData?.invoiceName || invoice.ticketName || customerName}
          </p>
        </div>

        {billData ? (
          <>
            <p>Invoice No: {billData.invoiceNo || invoice.invoice}</p>
            <p className="mt-1">Bill No: {billData.billNo || "N/A"}</p>
          </>
        ) : (
          <div className="text-right text-gray-600 ">
            <p>Date: {formattedDate}</p>
          </div>
        )}
      </div>

      {/* <div className="border-b border-dashed border-gray-400 mb-3" /> */}

      {/* ───────────────── Items Table ───────────────── */}
      <InvoiceBillTable invoices={invoice.items} />

      <div className="border-b border-dotted border-gray-300 mt-3 mb-3" />

      {/* ───────────────── Totals ───────────────── */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-700 tracking-wider">Subtotal</p>
          <p className="font-medium  tracking-wider">
            {formatCurrencySymbol(
              Number(displayTotal),
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-700 tracking-wider">Discount</p>
          <p className="font-medium  tracking-wider">
            −{" "}
            {formatCurrencySymbol(
              discountAmount || 0,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>

        {loyaltyRedeemedAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-700 tracking-wider">Discount By Points</p>
            <p className="font-medium  tracking-wider">
              −{" "}
              {formatCurrencySymbol(
                loyaltyRedeemedAmount,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>
        )}

        {isTaxInvoice && (
          <div className="flex justify-between">
            <p className="text-gray-700 tracking-wider">Tax</p>
            <p className="font-medium  tracking-wider">
              +{" "}
              {formatCurrencySymbol(
                taxAmount,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2  border-t border-dotted border-gray-300">
          <p className="font-bold text-base tracking-wider">
            {billData ? "Grand Total" : "Total Payable"}
          </p>
          <p className="font-bold text-base  tracking-wider ">
            {formatCurrencySymbol(
              Number(displayGrandTotal),
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>
      </div>

      {/* ───────────────── Payments received (credited) ───────────────── */}
      {paymentList.length > 0 && (
        <div className="mt-2 text-sm">
          <div className="space-y-1.5">
            {paymentList.map((p) => (
              <div
                key={p._id}
                className="flex justify-between my-1.5 text-gray-700  tracking-wider"
              >
                <span>
                  Payment on {formatPaymentDate(p.paymentDate)} using a{" "}
                  {paymentLabel(p.paymentMethod)}:
                </span>
                <span className="font-medium">
                  -{" "}
                  {formatCurrencySymbol(
                    p.paymentAmount ?? 0,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 mt-3 border-t border-dashed border-gray-400  tracking-wider">
            <p className="font-bold text-base">
              Amount Due ({currency.symbol || "NPR"}):
            </p>
            <p className="font-bold text-base">
              {formatCurrencySymbol(
                amountDue,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>
        </div>
      )}

      {/* ───────────────── Footer ───────────────── */}
      <div className="border-b border-dashed border-gray-400 my-6" />

      <div className="bg-gray-50 py-4 px-2 rounded-lg text-sm">
        <div className="flex justify-between items-start text-sm text-black-600">
          <div className="flex flex-col gap-2  tracking-wider">
            <p>Cashier: {billData?.generatedBy || "N/A"}</p>
            {billData && <p>Counter: POS12</p>}

            {billData?.status === "refunded" && (
              <p className="text-red-500 font-medium">Cancelled Bill</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2  tracking-wider">
            {billData && (
              <p>
                Payment Mode:{" "}
                {paymentModeLabel(paymentList, billData?.paymentMethod)}
              </p>
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
            <div className="flex flex-col justify-between gap-2  tracking-wider">
              <p>Current Point:</p>
              <p>Total Points:</p>
            </div>

            <div className="flex flex-col  gap-2 items-end  tracking-wider">
              <span>
                {" "}
                {formatAmount(billData?.currentPoint ?? 0, currency.locale) ||
                  "0"}
              </span>
              <span>
                {" "}
                {formatAmount(billData?.totalPoints ?? 0, currency.locale) ||
                  "0"}
              </span>
            </div>
          </div>
        )}

        <div className="text-center mt-10 text-xs text-gray-500  tracking-wider">
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
  credit,
  withControls = false,
  fluid = false,
  minHeightPx,
  showPan = true,
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
      credit={credit}
      isMobile={withControls ? isMobile : false}
      minHeightPx={minHeightPx}
      showPan={showPan}
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
      credit={credit}
      isMobile={false}
      minHeightPx={0}
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
  // Print and export sit in the header beside the back button rather than
  // floating over the canvas: they act on the whole preview, which is what the
  // header is for, and the canvas is left to the document alone.
  const actionButtons = withControls && (
    <div className="flex shrink-0 items-center gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
      >
        <Printer size={16} />
        <span className="hidden lg:inline-block">Print</span>
      </button>
      <button
        onClick={handleExportPdf}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-lg border border-[3px] border-blue-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download size={16} />
        <span className="hidden lg:inline-block">
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
            <div className="bg-white w-full">{printableDocument}</div>
          </div>,
          document.body,
        )}
    </>
  );

  const NAME_LIMIT = 8;

  const shortName = (name: string): string => {
    const clean = name.trim();
    return clean.length > NAME_LIMIT
      ? `${clean.slice(0, NAME_LIMIT)}...`
      : clean;
  };

  // Raw document — used for PDF export, screenshots, printing and public pages.
  if (!withControls) {
    return (
      <div
        ref={invoiceRef}
        className={fluid ? "bg-white w-full" : "bg-white w-[794px] mx-auto"}
      >
        {content}
      </div>
    );
  }

  // Interactive preview with a Desktop / Mobile toggle.
  return (
    <div className=" w-full bg-white border border-gray-200 overflow-hidden shadow-sm">
      {printSupport}

      {/* Preview header */}
      <div className=" relative bg-blue-100 border-b border-gray-200 px-5 py-3 flex items-center justify-between gap-2 print:hidden">
        <div className="flex flex-col items-left gap-1 text-[11px] text-blue-400">
          <span className="font-medium text-blue-500">PREVIEW MODE</span>

          <span className="hidden lg:inline-block">
            You are previewing how your customer will see this invoice.
          </span>
        </div>

        {/* Desktop / Mobile toggle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-white border border-blue-200 rounded-xl p-1 gap-1 shrink-0 ">
          {PREVIEW_MODES.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setPreviewMode(value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                previewMode === value
                  ? " bg-blue-600/80  font-bold text-white shadow-sm"
                  : "font-semibold text-blue-600/80 hover:text-blue-950 cursor-pointer"
              }`}
            >
              <Icon size={16} />
              <span className="hidden font-bold text-[13px] lg:inline-block">
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {actionButtons}

          <button
            onClick={() => router.push(`/invoices/${invoice.invoice}`)}
            className="shrink-0 cursor-pointer rounded-2xl border-[3px] border-blue-200 px-3 py-1.5 bg-blue-50 items-center justify-center text-[13px] font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            Back to{" "}
            {invoice.ticketName
              ? `${shortName(invoice.ticketName)} · #${invoice.invoice}`
              : `Invoice #${invoice.invoice}`}
          </button>
        </div>
      </div>

      {/* Preview canvas — animated width transition */}
      <div
        className="bg-blue-50 py-6 flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-x-auto"
        style={{ minHeight: isMobile ? "600px" : "800px" }}
      >
        {/* The ref sits on the document itself, never on the handset around
            it — anything that captured this node would otherwise put a bezel
            and a 9:41 status bar into the customer's invoice. */}
        {/* The ref sits on the document itself, never on the handset around
            it — anything that captured this node would otherwise put a bezel
            and a 9:41 status bar into the customer's invoice. */}
        <PhoneFrame active={isMobile} width={isMobile ? 375 : 794}>
          <div ref={invoiceRef} className="bg-white">
            {content}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
