"use client";

import Image from "next/image";

import businessLogo from "@/public/rebuzz.png";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  normalizePaymentMethod,
  paymentModeLabel,
} from "@/lib/config/transaction";
import { parseNepalTime } from "@/lib/mappers/transaction";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import {
  creditState,
  CREDIT_STATE_LABEL,
  formatDateLong,
  formatPaymentDate,
} from "./creditDetailHelpers";

export type CreditDocumentType = "proforma" | "invoice" | "tax";

export interface CreditDocumentCustomer {
  name?: string;
  customerPan?: string;
}

export interface CreditDocumentBusiness {
  businessName?: string | null;
  address?: string | null;
  panNumber?: number | string | null;
  logo?: string | null;
}

const TITLES: Record<CreditDocumentType, string> = {
  proforma: "Proforma Invoice",
  invoice: "Credit Invoice",
  tax: "Credit Tax Invoice",
};

/** Canonical render order — the tabs, the PDF list and the print list share it. */
export const CREDIT_DOCUMENT_TYPES: CreditDocumentType[] = [
  "proforma",
  "invoice",
  "tax",
];

export const CREDIT_DOC_LABELS: Record<CreditDocumentType, string> = {
  proforma: "Proforma",
  invoice: "Credit Invoice",
  tax: "Tax Invoice",
};

export const CREDIT_DOC_DESCRIPTIONS: Record<CreditDocumentType, string> = {
  proforma: "Estimate of what the credit covers",
  invoice: "Statement of the credit and its dues",
  tax: "Includes tax registration details",
};

/** Filename stem for a downloaded document. */
export const creditFileStem = (type: CreditDocumentType): string =>
  type === "tax" ? "tax-invoice" : type;

/**
 * The credit's own invoice document.
 *
 * Deliberately not the shared `InvoicePreview`: that one is built from a
 * ticket's grouped items and treats credit figures as an override. This is
 * built from the credit detail alone — its items, its totals, its payment
 * history — so the document says what the customer actually owes on this
 * credit, and it renders even when the original ticket cannot be loaded.
 */
export default function CreditInvoiceDocument({
  type,
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
  billData,
  documentRef,
  minHeightPx = 1200,
  isMobile = false,
  showPan = true,
}: {
  type: CreditDocumentType;
  credit: Credit;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
  /**
   * The POS bill, when the credit has been settled through the till. It carries
   * what the credit record cannot — bill number, cashier, payment mode and the
   * paid-at timestamp — so this document presents the same facts as the
   * invoice one.
   */
  billData?: Transaction | null;
  documentRef?: React.RefObject<HTMLDivElement | null>;
  minHeightPx?: number;
  isMobile?: boolean;
  /**
   * Whether the business PAN is printed in the header.
   *
   * On by default: a tax document that quietly dropped its registration number
   * would be the wrong thing to ship silently. The detail pages turn it off for
   * businesses that would rather not show it.
   */
  showPan?: boolean;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const isTaxInvoice = type === "tax";
  const state = creditState(credit);

  // Oldest first — a statement reads forwards, unlike the page's activity list.
  const paymentList = [...payments].sort((a, b) =>
    a.paymentDate.localeCompare(b.paymentDate),
  );
  const paid = paymentList.reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0);

  // The credit's own due is authoritative — it is what the backend will accept
  // a payment against. Grand-total-minus-paid is only a fallback for a credit
  // that has not been re-read since its last payment.
  const amountDue =
    credit.dueAmount ?? Math.max(0, Number(credit.grandTotal ?? 0) - paid);

  // Tax comes from the line items when the credit's own total is missing, and
  // only taxable lines count towards it.
  const lineTax = items.reduce(
    (sum, item) =>
      sum + (item.taxApplied ? (item.taxAmount ?? 0) * item.quantity : 0),
    0,
  );
  const taxAmount = credit.taxamt ?? lineTax;

  const customerName = credit.user?.name || customerProfile?.name || "Guest";

  const paymentLabel = (method?: string | null) =>
    `${normalizePaymentMethod(method)} Payment`;

  // A bill's paidAt needs the Nepal-timezone correction, then formatting with
  // `timeZone: "UTC"` so the result is identical on every machine. With no
  // bill, the credit's own creation date stands in.
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
    : new Date(
        (credit.creationDate || credit.createdAt).replace(" ", "T"),
      ).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  const formattedCancelledDate = new Date(
    billData?.updatedAt ?? credit.updatedAt,
  ).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isRefunded = billData?.status === "refunded";

  // ── Mobile layout — centred, compact ────────────────────────────────────
  if (isMobile) {
    return (
      <div
        ref={documentRef}
        className="bg-white w-full min-h-full font-sans text-gray-900 text-sm"
      >
        <div className="h-1.5 bg-gray-800" />

        {/* Business hero */}
        <div className="text-center px-5 pt-6 pb-4 border-b border-dashed border-gray-300">
          <p className="text-lg font-bold text-gray-900">
            {businessProfile?.businessName || "My Business"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {TITLES[type]} #{credit.invoiceNo}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-3">
            {fmt(amountDue)}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-700 mt-1">
            {CREDIT_STATE_LABEL[state]}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Credited on{" "}
            {formatDateLong(credit.creationDate || credit.createdAt)}
          </p>
        </div>

        {/* Details */}
        <div className="px-5 py-4 border-b border-dashed border-gray-300 space-y-2.5 text-xs">
          {[
            ["Invoice number:", String(credit.invoiceNo)],
            ["Credit total:", fmt(Number(credit.grandTotal ?? 0))],
            ["Paid so far:", fmt(paid)],
            ["Amount due:", fmt(amountDue)],
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
        <div className="px-5 py-4 border-b border-dashed border-gray-300">
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            <span>Items</span>
            <span>Amount</span>
          </div>

          {items.length === 0 && (
            <p className="py-3 text-center text-[11px] text-gray-400">
              This credit has no line items recorded.
            </p>
          )}

          {items.map((item, index) => (
            <div
              key={`${item._id}-${index}`}
              className="flex justify-between items-start py-2.5 border-b border-dotted border-gray-200 last:border-0"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs font-medium text-gray-900">
                  {item.productName}
                </p>
                {item.discount > 0 && (
                  <p className="text-[10px] text-red-400">
                    − {fmt(item.discount)} OFF
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {item.quantity} × {fmt(item.unitPrice)}
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-900 shrink-0">
                {fmt(item.quantity * item.unitPrice)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-b border-dashed border-gray-300 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">
              {fmt(Number(credit.total ?? 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium">− {fmt(credit.discount ?? 0)}</span>
          </div>
          {isTaxInvoice && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="font-medium">+ {fmt(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-dotted border-gray-200">
            <span className="text-xs font-bold text-gray-900">
              Total Payable
            </span>
            <span className="text-xs font-bold text-gray-900">
              {fmt(Number(credit.grandTotal ?? 0))}
            </span>
          </div>
        </div>

        {/* Payments */}
        <div className="px-5 py-4 space-y-2 text-xs">
          {paymentList.length > 0 ? (
            paymentList.map((p) => (
              <div key={p._id} className="flex justify-between gap-3">
                <span className="text-gray-500 min-w-0">
                  {formatPaymentDate(p.paymentDate)} ·{" "}
                  {paymentLabel(p.paymentMethod)}
                </span>
                <span className="font-medium shrink-0">
                  − {fmt(p.paymentAmount ?? 0)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No payments received yet.</p>
          )}

          <div className="flex justify-between pt-2 border-t border-dashed border-gray-300">
            <span className="text-xs font-bold text-gray-900">
              Amount Due ({currency.symbol || "NPR"})
            </span>
            <span className="text-xs font-bold text-gray-900">
              {fmt(amountDue)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 border-t border-dashed border-gray-300 pt-4 text-[10px] text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Status: {CREDIT_STATE_LABEL[state]}</span>
            <span>{paymentList.length} payment(s)</span>
          </div>
          <div className="flex justify-between">
            <span>Last updated: {formatDateLong(credit.updatedAt)}</span>
          </div>
          <p className="text-center text-gray-400 pt-3">
            All rights reserved · Rebuzz POS by Brand Builder Pvt Ltd
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={documentRef}
      style={{ minHeight: minHeightPx }}
      className="bg-white w-full px-10 py-10 text-black border-[3px] rounded-md border-gray-200 font-sans"
    >
      {/* ── Header ──
          data-pdf-block marks a unit the PDF exporter must not cut through;
          page breaks snap to the boundary between two of them. */}
      <div data-pdf-block className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-wider">{TITLES[type]}</h1>
        {/* <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-700">
          {CREDIT_STATE_LABEL[state]}
        </p> */}
      </div>

      {/* ── Business info ──
          Routed through next/image even for the remote logo: the optimiser
          serves it from this origin, so html-to-image can read it into the
          canvas. A direct cross-origin <img> would taint it. */}
      <div data-pdf-block className="flex justify-between items-start mb-10">
        <Image
          src={businessProfile?.logo || businessLogo}
          alt={`${businessProfile?.businessName || "Business"} logo`}
          width={150}
          height={150}
          quality={100}
          priority
          className="object-contain max-h-[150px] w-auto rounded-lg"
        />

        <div className="text-right tracking-wider">
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

      {/* ── Client info ── */}
      <div data-pdf-block className="mb-6">
        <h3 className="font-bold text-lg mb-1 tracking-wider">Client Info</h3>

        <div className="space-y-1 text-sm tracking-wider">
          <p>
            <span className="font-medium">Name:</span> {customerName}
          </p>
          <p>
            <span className="font-medium">Email:</span>{" "}
            {credit.user?.email || "N/A"}
          </p>
          {credit.user?.phone && (
            <p>
              <span className="font-medium">Phone:</span> {credit.user.phone}
            </p>
          )}
          <p>
            <span className="font-medium">Tax ID:</span>{" "}
            {customerProfile?.customerPan || "N/A"}
          </p>
        </div>
      </div>

      {/* ── Meta ── */}
      <div
        data-pdf-block
        className="flex justify-between items-center text-sm mb-3 tracking-wider"
      >
        <div>
          <p className="font-medium underline">
            {billData?.invoiceName || credit?.ticketName || customerName}
          </p>
        </div>

        {billData ? (
          <>
            <p>Invoice No: {billData.invoiceNo || credit.invoiceNo}</p>
            <p className="mt-1">Bill No: {billData.billNo || "N/A"}</p>
          </>
        ) : (
          <div className="text-right text-gray-600">
            {/* <p>Invoice No: {credit.invoiceNo}</p> */}
            <p className="mt-1">Date: {formattedDate}</p>
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div className="w-full overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr data-pdf-block className="bg-gray-300/20 border-b border-gray">
              <th className="text-left text-black font-bold text-sm tracking-wider py-3 pl-2 w-[40%]">
                Name
              </th>
              <th className="text-center text-black font-bold text-sm py-3 tracking-wider w-[20%]">
                Quantity
              </th>
              <th className="text-center text-black font-bold text-sm py-3 tracking-wider w-[20%]">
                Rate ( {currency.symbol} )
              </th>
              <th className="text-right text-black font-bold text-sm py-3 tracking-wider w-[20%] pr-2">
                Amount ( {currency.symbol} )
              </th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-sm text-gray-400 tracking-wider"
                >
                  This credit has no line items recorded.
                </td>
              </tr>
            )}

            {items.map((item, index) => (
              <tr data-pdf-block key={`${item._id}-${index}`}>
                <td className="py-2 text-sm text-black tracking-wider pl-2">
                  {item.productName}
                  {item.note && (
                    <span className="block text-[12px] text-gray-500">
                      {item.note}
                    </span>
                  )}
                  {/* {item.discount > 0 && (
                    <span className="block text-[12px] text-red-500 tracking-wider">
                      − {fmt(item.discount)} OFF
                    </span>
                  )} */}
                  {item.discounts.length !== 0 && (
                    <span className="block text-[12px] text-red-500/100 racking-wider">
                      {item.discounts.map((disc, idx) => (
                        <span key={idx} className="flex flex-col">
                          - {disc?.name}:{" "}
                          {disc?.type === "fixed"
                            ? formatCurrencySymbol(
                                Number(disc?.rate),
                                currency.symbol,
                                currency.locale,
                              )
                            : `${disc?.rate}%`}{" "}
                          OFF{" "}
                        </span>
                      ))}
                    </span>
                  )}
                  {/* {!item.isTaxable && (
                    <span className="block text-[11px] text-gray-400 tracking-wider">
                      Non-taxable
                    </span>
                  )} */}
                </td>
                <td className="py-2 text-center text-sm text-black tracking-wider">
                  x {item.quantity}
                </td>
                <td className="py-2 text-center text-sm text-black tracking-wider">
                  {formatAmount(Number(item.unitPrice), currency.locale)}
                </td>
                <td className="py-2 text-right text-sm text-black tracking-wider pr-2">
                  {formatAmount(
                    item.quantity * item.unitPrice,
                    currency.locale,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-b border-dotted border-gray-300 mt-3 mb-3" />

      {/* ── Totals ── */}
      <div data-pdf-block className="space-y-3 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-700 tracking-wider">Subtotal</p>
          <p className="font-medium tracking-wider">
            {fmt(Number(credit.total ?? 0))}
          </p>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-700 tracking-wider">Discount</p>
          <p className="font-medium tracking-wider">
            − {fmt(credit.discount ?? 0)}
          </p>
        </div>

        {isTaxInvoice && (
          <div className="flex justify-between">
            <p className="text-gray-700 tracking-wider">Tax</p>
            <p className="font-medium tracking-wider">+ {fmt(taxAmount)}</p>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-dotted border-gray-300">
          <p className="font-bold text-base tracking-wider">Total Payable</p>
          <p className="font-bold text-base tracking-wider">
            {fmt(Number(credit.grandTotal ?? 0))}
          </p>
        </div>
      </div>

      {/* ── Payments received ── */}
      <div data-pdf-block className="mt-2 text-sm">
        {paymentList.length > 0 ? (
          <div className="space-y-1.5">
            {paymentList.map((p) => (
              <div
                key={p._id}
                className="flex justify-between my-1.5 text-gray-700 tracking-wider"
              >
                <span>
                  Payment on {formatPaymentDate(p.paymentDate)} using a{" "}
                  {paymentLabel(p.paymentMethod)}:
                </span>
                <span className="font-medium">
                  − {fmt(p.paymentAmount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="my-1.5 text-gray-500 tracking-wider">
            No payments received against this credit yet.
          </p>
        )}

        <div className="flex justify-between pt-3 mt-3 border-t border-dashed border-gray-400 tracking-wider">
          <p className="font-bold text-base">
            Amount Due ({currency.symbol || "NPR"}):
          </p>
          <p className="font-bold text-base">{fmt(amountDue)}</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-b border-dashed border-gray-400 my-6" />

      <div data-pdf-block className="bg-gray-50 py-4 px-2 rounded-lg text-sm">
        <div className="flex justify-between items-start text-sm text-black-600">
          <div className="flex flex-col gap-2 tracking-wider">
            <p>Cashier: {billData?.generatedBy || "N/A"}</p>
            {billData && <p>Counter: POS12</p>}
            {/* <p>Status: {CREDIT_STATE_LABEL[state]}</p> */}

            {isRefunded && (
              <p className="text-red-500 font-medium">Cancelled Bill</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 tracking-wider">
            {/* Shown whenever the credit has been paid at all — instalments
                carry a method even before a POS bill exists. */}
            {(billData || paymentList.length > 0) && (
              <p>
                Payment Mode:{" "}
                {paymentModeLabel(paymentList, billData?.paymentMethod)}
              </p>
            )}

            <p>Date: {formattedDate}</p>

            {isRefunded && (
              <p className="text-red-500 font-medium">
                Date: {formattedCancelledDate}
              </p>
            )}
          </div>
        </div>

        {billData && (
          <div className="flex justify-between items-start text-sm text-black-600 mt-4 gap-2">
            <div className="flex flex-col justify-between gap-2 tracking-wider">
              <p>Current Point:</p>
              <p>Total Points:</p>
            </div>

            <div className="flex flex-col gap-2 items-end tracking-wider">
              <span>
                {formatAmount(billData.currentPoint ?? 0, currency.locale) ||
                  "0"}
              </span>
              <span>
                {formatAmount(billData.totalPoints ?? 0, currency.locale) ||
                  "0"}
              </span>
            </div>
          </div>
        )}

        <div className="text-center mt-10 text-xs text-gray-500 tracking-wider">
          <p>All rights reserved : Rebuzz POS by</p>
          <p className="mt-1 font-medium">Brand Builder Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
}
