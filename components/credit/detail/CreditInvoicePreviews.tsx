"use client";

import { useRef, useState } from "react";

import type {
  Credit,
  CreditItem,
  CreditPayment,
} from "@/services/apiCredit.client";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import CreditInvoiceDocument, {
  CREDIT_DOCUMENT_TYPES,
  CREDIT_DOC_LABELS,
  type CreditDocumentBusiness,
  type CreditDocumentCustomer,
  type CreditDocumentType,
} from "./CreditInvoiceDocument";

/**
 * The three credit documents, behind a tab bar.
 *
 * All three stay mounted — the inactive ones are parked off-screen rather than
 * unmounted — because the PDF and print paths rasterise a painted node, and a
 * node that has never rendered cannot be captured.
 */
export default function CreditInvoicePreviews({
  credit,
  items,
  payments,
  businessProfile,
  customerProfile,
  billData,
  showPan = true,
}: {
  credit: Credit;
  items: CreditItem[];
  payments: CreditPayment[];
  businessProfile?: CreditDocumentBusiness | null;
  customerProfile?: CreditDocumentCustomer | null;
  billData?: Transaction | null;
  /** Passed straight through to each document's header. */
  showPan?: boolean;
}) {
  const [documentType, setDocumentType] =
    useState<CreditDocumentType>("proforma");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = CREDIT_DOCUMENT_TYPES.indexOf(documentType);
    let next: number | null = null;

    if (e.key === "ArrowRight")
      next = (current + 1) % CREDIT_DOCUMENT_TYPES.length;
    if (e.key === "ArrowLeft")
      next =
        (current - 1 + CREDIT_DOCUMENT_TYPES.length) %
        CREDIT_DOCUMENT_TYPES.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = CREDIT_DOCUMENT_TYPES.length - 1;
    if (next === null) return;

    e.preventDefault();
    setDocumentType(CREDIT_DOCUMENT_TYPES[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      {/* ── Document type tabs ── */}
      <div className="relative flex justify-center mt-6 mb-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
        />
        <div
          role="tablist"
          aria-label="Credit document type"
          onKeyDown={handleTabKeyDown}
          className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
        >
          {CREDIT_DOCUMENT_TYPES.map((type, i) => {
            const selected = documentType === type;

            return (
              <button
                key={type}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`credit-doc-tab-${type}`}
                aria-selected={selected}
                aria-controls={`credit-doc-panel-${type}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setDocumentType(type)}
                className={`rounded-full px-5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                  selected
                    ? "bg-white font-bold text-blue-950 shadow-sm"
                    : "font-semibold text-blue-800 hover:text-blue-950"
                }`}
              >
                {CREDIT_DOC_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Documents ── */}
      {CREDIT_DOCUMENT_TYPES.map((type) => (
        <div
          key={type}
          role="tabpanel"
          id={`credit-doc-panel-${type}`}
          aria-labelledby={`credit-doc-tab-${type}`}
          className={
            documentType === type ? "block" : "absolute -left-[99999px] top-0"
          }
        >
          <CreditInvoiceDocument
            type={type}
            credit={credit}
            items={items}
            payments={payments}
            businessProfile={businessProfile}
            customerProfile={customerProfile}
            billData={billData}
            showPan={showPan}
          />
        </div>
      ))}
    </>
  );
}
