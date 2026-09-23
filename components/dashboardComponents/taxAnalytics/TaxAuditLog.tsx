"use client";

import { useState, useMemo } from "react";
import {
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ScrollText,
} from "lucide-react";
import { mockAuditLogData } from "@/lib/mockData/mock-tax-data";
import type {
  AuditLogEntry,
  AuditLogStatus,
} from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../chartCard";

// ── Helpers ───────────────────────────────────────────────────────────────

function exportCSV(data: AuditLogEntry[]) {
  const headers = [
    "Period",
    "TX Code",
    "Taxable Base",
    "Rate",
    "VAT Collected",
    "VAT Paid",
    "Remitted",
    "Still Owed",
    "Status",
  ];
  const rows = data.map((r) => [
    r.period,
    r.txCode,
    r.taxableBase,
    `${r.rate}%`,
    r.vatCollected,
    r.vatPaid,
    r.remitted,
    r.stillOwed,
    r.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tax-audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Status badge ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  AuditLogStatus,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  filed: { bg: "bg-gray-100", text: "text-gray-500", label: "Filed" },
  overdue: { bg: "bg-red-50", text: "text-red-600", label: "Overdue" },
};

function StatusBadge({ status }: { status: AuditLogStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc")
    return <ChevronUp size={12} style={{ color: CHART_PALETTE.blue }} />;
  if (dir === "desc")
    return <ChevronDown size={12} style={{ color: CHART_PALETTE.blue }} />;
  return <ArrowUpDown size={12} style={{ color: CHART_PALETTE.subtitle }} />;
}

// ── Column config ─────────────────────────────────────────────────────────

type SortKey = keyof Pick<
  AuditLogEntry,
  | "period"
  | "taxableBase"
  | "rate"
  | "vatCollected"
  | "vatPaid"
  | "remitted"
  | "stillOwed"
  | "status"
>;

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right" | "center";
  sortable?: boolean;
}[] = [
  { key: "period", label: "Period", align: "left", sortable: true },
  { key: "taxableBase", label: "Taxable base", align: "right", sortable: true },
  { key: "rate", label: "Rate", align: "center", sortable: false },
  {
    key: "vatCollected",
    label: "VAT collected",
    align: "right",
    sortable: true,
  },
  { key: "vatPaid", label: "VAT paid", align: "right", sortable: true },
  { key: "remitted", label: "Remitted", align: "right", sortable: true },
  { key: "stillOwed", label: "Still owed", align: "right", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: false },
];

// ── Main component ────────────────────────────────────────────────────────

export default function TaxAuditLog() {
  const { currency } = useCurrency();
  const [sortKey, setSortKey] = useState<SortKey>("period");
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const fmtRs = (v: number) => {
    return formatCurrencySymbol(v, currency.symbol, currency.locale);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((prev) =>
        prev === null ? "asc" : prev === "asc" ? "desc" : null,
      );
    }
  };

  const sorted = useMemo(() => {
    if (!sortDir) return mockAuditLogData;
    return [...mockAuditLogData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [sortKey, sortDir]);

  const getSortDir = (key: SortKey): SortDir =>
    sortKey === key ? sortDir : null;

  return (
    <ChartCard
      icon={ScrollText}
      // Slate, as before: Tailwind's slate-600 / slate-200 / slate-50.
      iconColor="#475569"
      iconBorder="#e2e8f0"
      iconBg="#f8fafc"
      title="Tax Detail / Audit Log"
      subtitle="Period-by-period breakdown of liabilities and payments"
      controls={
        <button
          onClick={() => exportCSV(sorted)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] transition-colors hover:bg-[#f8f9fa]"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.title,
          }}
        >
          <Download size={12} />
          Export CSV
        </button>
      }
      // Clipped so the lock overlay follows the card's rounded corners.
      className="overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the table. */}
      <LockDimFeactureOverlay component_name="Tax Audit Log" />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header row */}
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: CHART_PALETTE.grid,
                color: CHART_PALETTE.axis,
              }}
            >
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`select-none whitespace-nowrap px-4 pb-2.5 pt-1 text-[11px] font-normal ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.sortable ? "cursor-pointer transition-colors hover:text-[#3c4043]" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon dir={getSortDir(col.key)} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="border-b transition-colors last:border-0 hover:bg-[#f8f9fa]"
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                {/* Period */}
                <td className="px-4 py-3">
                  <p
                    className="text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {row.period}
                  </p>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {row.txCode}
                  </p>
                </td>

                {/* Taxable Base */}
                <td
                  className="px-4 py-3 text-right text-[13px] tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {fmtRs(row.taxableBase)}
                </td>

                {/* Rate */}
                <td
                  className="px-4 py-3 text-center text-[13px] tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {row.rate}%
                </td>

                {/* VAT Collected */}
                <td
                  className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {fmtRs(row.vatCollected)}
                </td>

                {/* VAT Paid */}
                <td
                  className="px-4 py-3 text-right text-[13px] tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {fmtRs(row.vatPaid)}
                </td>

                {/* Remitted */}
                <td
                  className="px-4 py-3 text-right text-[13px] tabular-nums"
                  style={{ color: CHART_PALETTE.good }}
                >
                  {fmtRs(row.remitted)}
                </td>

                {/* Still Owed */}
                <td
                  className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
                  style={{
                    color:
                      row.stillOwed > 0
                        ? CHART_PALETTE.bad
                        : CHART_PALETTE.subtitle,
                  }}
                >
                  {fmtRs(row.stillOwed)}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs"
        style={{ borderColor: CHART_PALETTE.grid }}
      >
        <p style={{ color: CHART_PALETTE.subtitle }}>
          Showing {sorted.length} periods
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span style={{ color: CHART_PALETTE.subtitle }}>
            Total VAT collected:{" "}
            <span
              className="font-medium tabular-nums"
              style={{ color: CHART_PALETTE.title }}
            >
              {fmtRs(sorted.reduce((s, r) => s + r.vatCollected, 0))}
            </span>
          </span>
          <span style={{ color: CHART_PALETTE.subtitle }}>
            Total remitted:{" "}
            <span
              className="font-medium tabular-nums"
              style={{ color: CHART_PALETTE.good }}
            >
              {fmtRs(sorted.reduce((s, r) => s + r.remitted, 0))}
            </span>
          </span>
          <span style={{ color: CHART_PALETTE.subtitle }}>
            Still owed:{" "}
            <span
              className="font-medium tabular-nums"
              style={{ color: CHART_PALETTE.bad }}
            >
              {fmtRs(sorted.reduce((s, r) => s + r.stillOwed, 0))}
            </span>
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
