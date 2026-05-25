// "use client";

// import Image from "next/image";
// import { RefObject } from "react";

// import businessLogo from "@/public/rebuzz.png";

// import { useCurrency } from "@/providers/CurrencyContext";
// import { InvoiceItemGroup } from "@/lib/types/invoice";

// import InvoiceBillTable from "../ticket/InvoiceBillTable";

// interface InvoiceData {
//   _id: string;
//   invoice: number;
//   ticketName: string;
//   customerEmail: string;
//   phoneNumber: string;
//   grandTotal: number;
//   total: number;
//   taxamt?: number;
//   discount?: number;
//   discountByPoints?: number;
//   ticketTakenBy: string;
//   createdAt: string;
//   updatedAt: string;
//   items: InvoiceItemGroup[];
// }

// interface CustomerProfile {
//   name?: string;
//   loyaltyPoint?: number;
// }

// interface BusinessProfile {
//   businessName?: string | null;
//   address?: string | null;
//   panNumber?: number | string | null;
// }

// interface InvoicePreviewProps {
//   proformaTag: "proforma" | "invoice" | "tax";
//   invoiceRef?: RefObject<HTMLDivElement | null>;
//   invoice: InvoiceData;
//   // cashier: Customer;
//   customerProfile?: CustomerProfile | null;
//   businessProfile?: BusinessProfile | null;
// }

// const InvoicePreview = ({
//   proformaTag,
//   invoiceRef,
//   invoice,
//   // cashier,
//   customerProfile,
//   businessProfile,
// }: InvoicePreviewProps) => {
//   const { currency } = useCurrency();

//   const customerName =
//     customerProfile?.name ||
//     invoice.ticketName ||
//     invoice.customerEmail ||
//     "Guest";

//   const formattedDate = new Date(invoice.createdAt).toLocaleString(undefined, {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });

//   const calculatedTaxAmount = invoice.items.reduce((groupSum, group) => {
//     const itemTax = group.item.reduce((sum, product) => {
//       return (
//         sum + (product.taxApplied ? product.taxAmount * product.quantity : 0)
//       );
//     }, 0);

//     return groupSum + itemTax;
//   }, 0);

//   const discountAmount = invoice.discount ?? 0;
//   const loyaltyRedeemedAmount = invoice.discountByPoints ?? 0;
//   const taxAmount = calculatedTaxAmount;

//   return (
//     <div
//       ref={invoiceRef}
//       className="bg-white w-full max-w-3xl mx-auto px-8 py-10 text-black font-sans"
//     >
//       {/* ── Title ── */}
//       <div className="text-center mb-10">
//         <h1 className="text-3xl font-bold tracking-tight">
//           {proformaTag === "proforma"
//             ? "Proforma Invoice"
//             : proformaTag === "invoice"
//               ? "Invoice"
//               : "Tax Invoice"}
//         </h1>
//       </div>

//       {/* ── Business header: logo left, info right ── */}
//       <div className="flex justify-between items-start mb-10">
//         <Image
//           src={businessLogo}
//           alt="Business Logo"
//           width={120}
//           height={120}
//           quality={100}
//           className="object-contain"
//         />
//         <div className="text-right">
//           <h2 className="text-xl font-bold">
//             {businessProfile?.businessName || "My Business"}
//           </h2>
//           <p className="text-base mt-0.5">
//             {businessProfile?.address || "Nepal"}
//           </p>
//           {/* {businessProfile?.panNo && ( */}
//           <p className="text-sm mt-0.5 text-gray-600">
//             Pan no: {businessProfile?.panNumber || "609699393"}
//           </p>
//           {/* )} */}
//         </div>
//       </div>

//       {/* ── Divider ── */}
//       <div className="border-b border-gray-400 mb-5" />

//       {/* ── Client info ── */}
//       <div className="mb-6">
//         <h3 className="font-bold text-base mb-2">Client Info:</h3>
//         <p className="text-sm">
//           <span className="font-medium">Name:</span> {customerName}
//         </p>
//         <p className="text-sm mt-1">
//           <span className="font-medium">Email:</span>{" "}
//           {invoice.customerEmail || "N/A"}
//         </p>
//         {invoice.phoneNumber && (
//           <p className="text-sm mt-1">
//             <span className="font-medium">Phone:</span> {invoice.phoneNumber}
//           </p>
//         )}
//       </div>

//       {/* ── Divider ── */}
//       <div className="border-b border-gray-400 mb-4" />

//       {/* ── Customer name + date row ── */}
//       <div className="flex justify-between items-center mb-4 text-sm">
//         <p className="underline font-medium">{customerName}</p>
//         <p className="text-gray-600">Date: {formattedDate}</p>
//       </div>

//       {/* ── Divider ── */}
//       <div className="border-b border-gray-400 mb-6" />

//       {/* ── Items table ── */}
//       <InvoiceBillTable invoices={invoice.items} />

//       {/* ── Divider ── */}
//       <div className="border-b border-gray-400 mt-2 mb-5" />

//       {/* ── Totals ── */}
//       <div className="space-y-2 text-sm">
//         <div className="flex justify-between">
//           <p className="text-gray-600">Subtotal</p>
//           <p className="font-medium">
//             {currency.symbol} {Number(invoice.total).toFixed(2)}
//           </p>
//         </div>

//         {discountAmount > 0 && (
//           <div className="flex justify-between">
//             <p className="text-gray-600">Discount</p>
//             <p className="text-blue-500">
//               − {currency.symbol} {discountAmount.toFixed(2)}
//             </p>
//           </div>
//         )}

//         {loyaltyRedeemedAmount > 0 && (
//           <div className="flex justify-between">
//             <p className="text-gray-600">Loyalty Redeemed</p>
//             <p className="text-orange-500">
//               − {currency.symbol} {loyaltyRedeemedAmount.toFixed(2)}
//             </p>
//           </div>
//         )}

//         {taxAmount > 0 && (
//           <div className="flex justify-between">
//             <p className="text-gray-600">Tax</p>
//             <p className="font-medium text-red-500">
//               + {currency.symbol} {taxAmount.toFixed(2)}
//             </p>
//           </div>
//         )}

//         <div className="flex justify-between font-bold text-base pt-1">
//           <p>Total Payable</p>
//           <p>
//             {currency.symbol} {Number(invoice.grandTotal).toFixed(2)}
//           </p>
//         </div>
//       </div>

//       {/* ── Divider ── */}
//       <div className="border-b border-gray-400 my-6" />

//       {/* ── Footer ── */}
//       <div className="flex justify-between items-start text-sm text-gray-600">
//         <p>Cashier: {"N/A"}</p>
//         <p>Date: {formattedDate}</p>
//       </div>

//       {/* ── Copyright ── */}
//       <div className="text-center mt-10 text-xs text-gray-500">
//         <p>All rights reserved : Rebuzz POS by</p>
//         <p className="mt-0.5 font-medium">
//           {businessProfile?.businessName || "My Business"}
//         </p>
//       </div>
//     </div>
//   );
// };
// export default InvoicePreview;

"use client";

import Image from "next/image";
import { RefObject } from "react";

import businessLogo from "@/public/rebuzz.png";

import { useCurrency } from "@/providers/CurrencyContext";
import { InvoiceItemGroup } from "@/lib/types/invoice";

import InvoiceBillTable from "../ticket/InvoiceBillTable";

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
}

const InvoicePreview = ({
  type,
  invoiceRef,
  invoice,
  customerProfile,
  businessProfile,
}: InvoicePreviewProps) => {
  const { currency } = useCurrency();

  const customerName =
    customerProfile?.name ||
    invoice.ticketName ||
    invoice.customerEmail ||
    "Guest";

  const formattedDate = new Date(invoice.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const calculatedTaxAmount = invoice.items.reduce((groupSum, group) => {
    const itemTax = group.item.reduce((sum, product) => {
      return (
        sum + (product.taxApplied ? product.taxAmount * product.quantity : 0)
      );
    }, 0);

    return groupSum + itemTax;
  }, 0);

  const discountAmount = invoice.discount ?? 0;
  const loyaltyRedeemedAmount = invoice.discountByPoints ?? 0;
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
      className="bg-white w-full max-w-3xl mx-auto px-8 py-10 text-black font-sans"
    >
      {/* ───────────────── Header ───────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{invoiceTitle}</h1>

        {isProforma && (
          <p className="text-sm text-gray-500 mt-2">
            This is an estimated invoice and not a final tax invoice.
          </p>
        )}
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

          {/* Show PAN only for tax invoice */}
          {isTaxInvoice && (
            <p className="text-sm mt-1 text-gray-600">
              PAN No: {businessProfile?.panNumber || "609699393"}
            </p>
          )}

          {/* Invoice number */}
          <p className="text-sm mt-1 text-gray-500">
            Invoice #: {invoice.invoice}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-300 mb-6" />

      {/* ───────────────── Customer Info ───────────────── */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3">Client Info</h3>

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
        </div>
      </div>

      <div className="border-b border-gray-300 mb-5" />

      {/* ───────────────── Meta Info ───────────────── */}
      <div className="flex justify-between items-center text-sm mb-5">
        <div>
          <p className="font-medium underline">{customerName}</p>
        </div>

        <div className="text-right text-gray-600">
          <p>Date: {formattedDate}</p>

          {/* {isTaxInvoice && <p className="mt-1">Tax Type: VAT Included</p>} */}
        </div>
      </div>

      <div className="border-b border-gray-300 mb-6" />

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

        {/* Discount */}
        {isTaxInvoice && discountAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Discount</p>

            <p className="text-blue-500">
              − {currency.symbol} {discountAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Loyalty */}
        {loyaltyRedeemedAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Loyalty Redeemed</p>

            <p className="text-orange-500">
              − {currency.symbol} {loyaltyRedeemedAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Tax only for Tax Invoice */}
        {isTaxInvoice && taxAmount > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-600">Tax</p>

            <p className="font-medium text-red-500">
              + {currency.symbol} {taxAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between pt-2  border-gray-200">
          <p className="font-bold text-base">Total Payable</p>

          <p className="font-bold text-base">
            {currency.symbol} {Number(invoice.grandTotal).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ───────────────── Footer ───────────────── */}
      <div className="border-b border-gray-300 my-6" />

      <div className="flex justify-between items-start text-sm text-gray-600">
        <p>Cashier: {invoice.ticketTakenBy || "N/A"}</p>

        <p>Date: {formattedDate}</p>
      </div>

      {/* ───────────────── Notes ───────────────── */}
      {isProforma && (
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
      )}

      {/* ───────────────── Copyright ───────────────── */}
      <div className="text-center mt-10 text-xs text-gray-500">
        <p>All rights reserved : Rebuzz POS by</p>

        <p className="mt-1 font-medium">
          {businessProfile?.businessName || "My Business"}
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
