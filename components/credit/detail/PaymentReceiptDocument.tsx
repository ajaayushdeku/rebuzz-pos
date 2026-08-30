"use client";

import { Check } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { normalizePaymentMethod } from "@/lib/config/transaction";
import type { Credit, CreditPayment } from "@/services/apiCredit.client";
import { formatDateLong } from "./creditDetailHelpers";
import { useEffect, useState } from "react";
export interface ReceiptBusiness {
  businessName?: string | null;
  address?: string | null;
  email?: string | null;
  logo?: string | null;
}

export interface ReceiptCustomer {
  name?: string;
}

export interface ReceiptContext {
  index: number;
  total: number;
  paidToDate: number;
}

export const RECEIPT_CARD_WIDTH_PX = 520;

/** Filename stem for one payment's receipt. */
export const receiptFileStem = (credit: Credit, ctx: ReceiptContext): string =>
  `receipt-${credit.invoiceNo}-${ctx.index}`;

/**
 * A receipt for a single payment.
 *
 * Deliberately not a variant of `CreditInvoiceDocument`: an invoice argues a
 * balance from line items and tax, while a receipt asserts one fact — this
 * much was received, on this day, by this method. Everything that does not
 * serve that fact is left out, which is why there is no item table here.
 *
 * The one addition to the classic receipt shape is the balance line. These are
 * receipts for *partial* payments, so "what is still owed" is the question the
 * customer asks next, and answering it here saves them opening the invoice.
 */
export default function PaymentReceiptDocument({
  credit,
  payment,
  context,
  businessProfile,
  customerProfile,
  documentRef,
  minHeightPx,
}: {
  credit: Credit;
  payment: CreditPayment;
  context: ReceiptContext;
  businessProfile?: ReceiptBusiness | null;
  customerProfile?: ReceiptCustomer | null;
  documentRef?: React.RefObject<HTMLDivElement | null>;
  /** A4 height while rasterising; 0 lets the receipt size to its content. */
  minHeightPx?: number;
}) {
  const { currency } = useCurrency();
  const [businerOwner, setBusinessOwner] = useState<{ email?: string } | null>(
    null,
  );
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const customerName = credit.user?.name || customerProfile?.name || "Guest";
  const businessName = businessProfile?.businessName || "My Business";
  const method = normalizePaymentMethod(payment.paymentMethod);

  const amount = payment.paymentAmount ?? 0;
  // `dueAmount` is the balance *after* this payment — the same figure the
  // payment-history table labels "Due after payment".
  // const balance = payment.dueAmount ?? 0;
  // const isSettled = balance <= 0;

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        setBusinessOwner(data.data.user);
      } catch {
        console.error("Failed to fetch user profile");
      }
    };
    loadUserId();
  }, []);

  return (
    <div
      ref={documentRef}
      data-pdf-block
      className="flex justify-center bg-white"
      style={{ minHeight: minHeightPx ? `${minHeightPx}px` : undefined }}
    >
      {/* The card. `self-start` keeps it at the top of the page when the outer
          box is stretched to A4 height for the PDF, rather than floating in
          the middle of the sheet. */}
      <div
        className="flex w-full flex-col self-start border rounded-md border-[2px] border-gray-300 bg-white"
        style={{ maxWidth: `${RECEIPT_CARD_WIDTH_PX}px` }}
      >
        <div className="flex-1  pt-10 pb-7 text-center">
          <h1 className="text-4xl font-bold tracking-[1px] text-gray-900">
            Payment Receipt
          </h1>

          <p className="mt-4 text-lg font-bold text-gray-900">
            {/* Invoice #{credit.invoiceNo} */}
            {credit.ticketName} #{credit.invoiceNo}
          </p>

          <p className="mt-1 text-base text-gray-500">for {customerName}</p>
          <p className="mt-0.5 text-base text-gray-500">
            paid on {formatDateLong(payment.paymentDate)}
          </p>

          <p className="mt-7 text-base font-bold text-gray-900">
            {businessName}
          </p>
          {businessProfile?.address ? (
            <p className="mt-0.5 text-base text-gray-500">
              {businessProfile.address}
            </p>
          ) : null}

          {/* A rule broken by a tick — the receipt's one piece of ornament, and
            the quickest way to read "this went through". */}
          <div className="mt-9 flex items-center" aria-hidden>
            <span className="h-px flex-1 bg-gray-300" />
            <span className="mx-3 flex h-7 w-7 items-center justify-center rounded-full border border-green-300 bg-white">
              <Check size={14} className="text-green-300" strokeWidth={3} />
            </span>
            <span className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Amount — the reason the document exists, so it is the only thing
            fenced off by rules of its own. */}
          <div className="mx-auto mt-9 max-w-sm border-y border-gray-300 px-2 w-full py-5">
            <p className="text-xl text-gray-700 tracking-wide">
              Payment Amount:{" "}
              <span className="font-bold text-gray-900">{fmt(amount)}</span>
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-700 tracking-wide">
            <span className="font-semibold uppercase tracking-[1px]">
              Payment method:
            </span>{" "}
            <span className="uppercase">{method}</span>
          </p>

          {/* <p className="mt-2 text-sm text-gray-700">
          <span className="font-bold uppercase tracking-wide">
            {isSettled ? "Balance:" : "Balance remaining:"}
          </span>{" "}
          <span className={isSettled ? "font-semibold text-green-600" : ""}>
            {isSettled ? "Paid in full" : fmt(balance)}
          </span>
        </p> */}

          {/* {context.total > 1 ? (
          <p className="mt-2 text-xs text-gray-400">
            Payment {context.index} of {context.total} ·{" "}
            {fmt(context.paidToDate)} received to date
          </p>
        ) : null} */}

          {/* {businessProfile?.logo ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              Powered by
            </span>
            <img
              src={businessProfile.logo}
              alt=""
              className="h-5 w-auto object-contain"
            />
          </div>
        ) : null} */}

          <div className="text-center mt-6 text-xs text-gray-500 tracking-wider">
            <p>All rights reserved : Rebuzz POS by</p>
            <p className="mt-1 font-medium">Brand Builder Pvt Ltd</p>
          </div>
        </div>

        {/* Footer band */}
        <div className="w-full flex items-center justify-center border-t border-[2px] border-gray-300 font-semibold  bg-gray-200 px-8 py-3 text-center">
          <p className="text-[13px]  w-[80%] leading-relaxed text-gray-500">
            Thanks for your business. If this receipt was sent in error, please
            contact{" "}
            {businerOwner?.email ? (
              <a
                href={`mailto:${businerOwner?.email}`}
                className="font-semibold text-blue-600"
              >
                {businerOwner?.email}
              </a>
            ) : (
              <span className="font-bold text-blue-700">{businessName}</span>
            )}
            .
          </p>
        </div>
      </div>
    </div>
  );
}
