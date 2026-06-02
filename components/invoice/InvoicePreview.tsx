"use client";

import Image from "next/image";
import { RefObject } from "react";

import businessLogo from "@/public/rebuzz.png";

import { useCurrency } from "@/providers/CurrencyContext";
import { InvoiceItemGroup } from "@/lib/types/invoice";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import InvoiceBillTable from "./InvoiceBillTable";

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

interface InvoicePreviewProps {
  type: "proforma" | "invoice" | "tax";
  invoiceRef?: RefObject<HTMLDivElement | null>;
  invoice: InvoiceData;
  customerProfile?: CustomerProfile | null;
  businessProfile?: BusinessProfile | null;
  /** When provided, overrides the invoice data with paid bill data (e.g. cashier name from generatedBy) */
  billData?: Transaction | null;
}

const InvoicePreview = ({
  type,
  invoiceRef,
  invoice,
  customerProfile,
  businessProfile,
  billData,
}: InvoicePreviewProps) => {
  const { currency } = useCurrency();

  const customerName =
    customerProfile?.name ||
    invoice.ticketName ||
    invoice.customerEmail ||
    "Guest";

  const formattedDate = new Date(
    billData?.createdAt ? billData?.createdAt : invoice.createdAt,
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

  console.log("Invoice Data:", billData?.createdAt);

  const calculatedTaxAmount = invoice.items.reduce((groupSum, group) => {
    const itemTax = group.item.reduce((sum, product) => {
      return (
        sum + (product.taxApplied ? product.taxAmount * product.quantity : 0)
      );
    }, 0);

    return groupSum + itemTax;
  }, 0);

  const discountAmount = billData?.discount ?? invoice.discount ?? 0;
  const loyaltyRedeemedAmount = billData?.discountByPoints ?? 0;
  const taxAmount = calculatedTaxAmount;

  // ─────────────────────────────────────────────
  // Invoice Type Config
  // ─────────────────────────────────────────────

  const isProforma = type === "proforma";
  const isTaxInvoice = type === "tax";

  const invoiceTitle = isProforma
    ? "Proforma Invoice"
    : isTaxInvoice
      ? "Tax Invoice"
      : "Invoice";

  return (
    <div
      ref={invoiceRef}
      className="bg-white w-[794px] min-h-[1123px] mx-auto px-8 py-10 text-black font-sans"
    >
      {/* ───────────────── Header ───────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{invoiceTitle}</h1>

        {/* {isProforma && (
          <p className="text-sm text-gray-500 mt-2">
            This is an estimated invoice and not a final tax invoice.
          </p>
        )} */}
      </div>

      {/* ───────────────── Business Info ───────────────── */}
      <div className="flex justify-between items-start mb-10">
        <Image
          src={businessLogo}
          alt="Business Logo"
          width={120}
          height={120}
          quality={100}
          className="object-contain"
        />

        <div className="text-right">
          <h2 className="text-2xl font-bold">
            {businessProfile?.businessName || "My Business"}
          </h2>

          <p className="text-base mt-1">
            {businessProfile?.address || "Nepal"}
          </p>

          {/* Business PAN — shown for all invoice types, replaces invoice number */}
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
        {/* Subtotal */}
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>

          <p className="font-medium">
            {currency.symbol} {Number(invoice.total).toFixed(2)}
          </p>
        </div>

        {/* Discount
        {isTaxInvoice && discountAmount > 0 && ( */}
        <div className="flex justify-between">
          <p className="text-gray-600">Discount</p>

          <p className="font-medium">
            − {currency.symbol} {discountAmount.toFixed(2) || 0}
          </p>
        </div>
        {/* )} */}

        {/* Loyalty */}
        {loyaltyRedeemedAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Discount By Points</p>

            <p className="font-medium">
              − {currency.symbol} {loyaltyRedeemedAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Tax only for Tax Invoice */}
        {isTaxInvoice && taxAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Tax</p>

            <p className="font-medium">
              + {currency.symbol} {taxAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between pt-2  border-gray-200">
          <p className="font-bold text-base">
            {billData ? "Grand Total" : "Total Payable"}
          </p>

          <p className="font-bold text-base">
            {currency.symbol} {Number(invoice.grandTotal).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ───────────────── Footer ───────────────── */}
      <div className="border-b border-gray-300 my-6" />

      <div className="bg-gray-50 py-4 rounded-lg text-sm">
        <div className="flex justify-between items-start text-sm text-black-600">
          <div className="flex flex-col gap-2">
            <p>Cashier: {billData?.generatedBy || "N/A"}</p>
            {billData && <p>Counter: N/A</p>}

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

        {/* ───────────────── Copyright ───────────────── */}
        <div className="text-center mt-10 text-xs text-gray-500">
          <p>All rights reserved : Rebuzz POS by</p>

          <p className="mt-1 font-medium">
            {/* {businessProfile?.businessName || "My Business"} */}
            Brand Builder Pvt Ltd
          </p>
        </div>
      </div>

      {/* ───────────────── Notes ───────────────── */}
      {/* {isProforma && (
        <div className="mt-8 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-700">
            This Proforma Invoice is for estimation purposes only and does not
            serve as a final tax invoice.
          </p>
        </div>
      )}

      {type === "invoice" && (
        <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700">
            Thank you for your purchase. Please keep this invoice for your
            records.
          </p>
        </div>
      )}

      {isTaxInvoice && (
        <div className="mt-8 p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">
            This is an official tax invoice and includes applicable taxes.
          </p>
        </div>
      )} */}
    </div>
  );
};

export default InvoicePreview;
