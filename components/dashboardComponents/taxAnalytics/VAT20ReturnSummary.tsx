"use client";

import { FileText, Download, CheckCircle2 } from "lucide-react";
import { mockVAT20SummaryData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const STATUS_STYLES = {
  ready: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Ready to File",
    icon: <CheckCircle2 size={12} className="text-green-600" />,
  },
  draft: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    label: "Draft",
    icon: null,
  },
  filed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Filed",
    icon: <CheckCircle2 size={12} className="text-blue-600" />,
  },
};

function Row({
  label,
  value,
  bold,
  colored,
}: {
  label: string;
  value: string;
  bold?: boolean;
  colored?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center ${bold ? "font-semibold" : ""}`}
    >
      <span
        className={`text-sm ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${colored ? "text-blue-600 font-bold" : bold ? "text-gray-800 font-semibold" : "text-gray-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">
      {label}
    </p>
  );
}

export default function VAT20ReturnSummary() {
  const { currency } = useCurrency();
  const d = mockVAT20SummaryData;
  const status = STATUS_STYLES[d.status];

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="VAT-20 Return Summary" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              VAT-20 Return Summary
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              IRD Tax Return Form Preview
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Section 1 — Sales output */}
      <SectionLabel label="1. Sales (Output)" />
      <div className="space-y-2.5">
        <Row
          label="Taxable Sales (Standard Rate)"
          value={fmt(d.taxableSales)}
        />
        <Row label="Exempt Sales" value={fmt(d.exemptSales)} />
        <div className="border-t border-gray-100 pt-2">
          <Row
            label="Total Output VAT Collected"
            value={fmt(d.totalOutputVAT)}
            colored
          />
        </div>
      </div>

      {/* Section 2 — Purchases input */}
      <SectionLabel label="2. Purchases (Input)" />
      <div className="space-y-2.5">
        <Row label="Input VAT Paid on Purchases" value={fmt(d.inputVATPaid)} />
        <Row label="VAT Refunds Claimed" value={fmt(d.vatRefundsClaimed)} />
        <div className="border-t border-gray-100 pt-2">
          <Row
            label="Total Deductible VAT"
            value={fmt(d.totalDeductibleVAT)}
            colored
          />
        </div>
      </div>

      {/* Section 3 — Final settlement */}
      <div className="mt-2 bg-blue-50 rounded-xl px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            3. Final Settlement
          </p>
          <p className="text-xs text-blue-500 mt-0.5">Net VAT Payable to IRD</p>
        </div>
        <p className="text-xl font-bold text-blue-700">
          {fmt(d.netVATPayable)}
        </p>
      </div>

      {/* Download button */}
      <button className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors mt-1">
        <Download size={15} />
        Download Draft VAT-20
      </button>
    </div>
  );
}
