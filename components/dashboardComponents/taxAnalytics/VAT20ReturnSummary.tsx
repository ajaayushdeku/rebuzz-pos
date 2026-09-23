"use client";

import { FileText, Download, CheckCircle2 } from "lucide-react";
import { mockVAT20SummaryData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

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
  colored,
}: {
  label: string;
  value: string;
  /** The line a section adds up to. */
  colored?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px]" style={{ color: CHART_PALETTE.axis }}>
        {label}
      </span>
      <span
        className="text-[13px] tabular-nums"
        style={{
          color: colored ? CHART_PALETTE.blue : CHART_PALETTE.title,
          fontWeight: colored ? 500 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="mb-2 mt-4 text-[13px] font-medium"
      style={{ color: CHART_PALETTE.title }}
    >
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
        <div
          className="border-t pt-2.5"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
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
        <div
          className="border-t pt-2.5"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
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
      <button
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white py-2.5 text-[13px] transition-colors hover:bg-[#f8f9fa]"
        style={{
          borderColor: CHART_PALETTE.control,
          color: CHART_PALETTE.title,
        }}
      >
        <Download size={15} />
        Download Draft VAT-20
      </button>
    </ChartCard>
  );
}
