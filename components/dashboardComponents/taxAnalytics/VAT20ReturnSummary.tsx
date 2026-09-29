"use client";

import { FileText, Download, CheckCircle2 } from "lucide-react";
import { mockVAT20SummaryData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "../chartCard";

const STATUS_STYLES = {
  ready: {
    bg: "bg-green-50 dark:bg-emerald-400/10",
    text: "text-green-700 dark:text-emerald-300",
    border: "border-green-200 dark:border-emerald-400/25",
    label: "Ready to File",
    icon: (
      <CheckCircle2
        size={12}
        className="text-green-600 dark:text-emerald-400"
      />
    ),
  },
  draft: {
    bg: "bg-gray-50 dark:bg-white/5",
    text: "text-gray-600 dark:text-[#a9b4c7]",
    border: "border-gray-200 dark:border-white/15",
    label: "Draft",
    icon: null,
  },
  filed: {
    bg: "bg-blue-50 dark:bg-blue-400/10",
    text: "text-blue-700 dark:text-[#a8c4ee]",
    border: "border-blue-200 dark:border-blue-400/25",
    label: "Filed",
    icon: (
      <CheckCircle2 size={12} className="text-blue-600 dark:text-[#7ba2e3]" />
    ),
  },
};

function Row({
  label,
  value,
  colored,
}: {
  label: string;
  value: string;
  /** The line a section adds up to. */
  colored?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#5f6368] dark:text-[#a9b4c7]">
        {label}
      </span>
      <span
        className={`text-[13px] tabular-nums ${
          colored
            ? "font-medium text-[#1a73e8] dark:text-[#7ba2e3]"
            : "text-[#3c4043] dark:text-[#e8ecf4]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-2 mt-4 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
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
    <ChartCard
      icon={FileText}
      title="VAT-20 Return Summary"
      subtitle="IRD Tax Return Form Preview"
      controls={
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${status.bg} ${status.text} ${status.border}`}
        >
          {status.icon}
          {status.label}
        </span>
      }
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the figures. */}
      <LockDimFeactureOverlay component_name="VAT-20 Return Summary" />

      {/* Section 1 — Sales output */}
      <SectionLabel label="1. Sales (Output)" />
      <div className="space-y-2.5">
        <Row
          label="Taxable Sales (Standard Rate)"
          value={fmt(d.taxableSales)}
        />
        <Row label="Exempt Sales" value={fmt(d.exemptSales)} />
        <div className="border-t pt-2.5 border-[#e8eaed] dark:border-white/10">
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
        <div className="border-t pt-2.5 border-[#e8eaed] dark:border-white/10">
          <Row
            label="Total Deductible VAT"
            value={fmt(d.totalDeductibleVAT)}
            colored
          />
        </div>
      </div>

      {/* Section 3 — Final settlement */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-blue-600 px-4 py-3.5">
        <div>
          <p className="text-[13px] font-medium text-white">
            3. Final Settlement
          </p>
          <p className="mt-0.5 text-[11px] text-blue-100">
            Net VAT Payable to IRD
          </p>
        </div>
        <p className="text-xl font-semibold tracking-tight tabular-nums text-white">
          {fmt(d.netVATPayable)}
        </p>
      </div>

      {/* Download button */}
      <button className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white py-2.5 text-[13px] transition-colors hover:bg-[#f8f9fa] border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4] dark:hover:bg-white/10 dark:bg-white/5">
        <Download size={15} />
        Download Draft VAT-20
      </button>
    </ChartCard>
  );
}
