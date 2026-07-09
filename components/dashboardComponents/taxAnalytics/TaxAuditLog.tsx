"use client";

import { useState, useMemo } from "react";
import { Download, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { mockAuditLogData } from "@/lib/mockData/mock-tax-data";
import type {
  AuditLogEntry,
  AuditLogStatus,
} from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={12} className="text-blue-500" />;
  if (dir === "desc")
    return <ChevronDown size={12} className="text-blue-500" />;
  return <ArrowUpDown size={12} className="text-gray-300" />;
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
  { key: "taxableBase", label: "Taxable Base", align: "right", sortable: true },
  { key: "rate", label: "Rate", align: "center", sortable: false },
  {
    key: "vatCollected",
    label: "VAT Collected",
    align: "right",
    sortable: true,
  },
  { key: "vatPaid", label: "VAT Paid", align: "right", sortable: true },
  { key: "remitted", label: "Remitted", align: "right", sortable: true },
  { key: "stillOwed", label: "Still Owed", align: "right", sortable: true },
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
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <LockDimFeactureOverlay component_name="Tax Audit Log" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Tax Detail / Audit Log
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Period-by-period breakdown of liabilities and payments
          </p>
        </div>
        <button
          onClick={() => exportCSV(sorted)}
          className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          {/* Header row */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap select-none ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.sortable ? "cursor-pointer hover:text-gray-600 transition-colors" : ""}`}
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
            {sorted.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${
                  idx === 0 ? "bg-white" : ""
                }`}
              >
                {/* Period */}
                <td className="py-4 px-4">
                  <p className="font-semibold text-gray-900 text-[13px]">
                    {row.period}
                  </p>
                  <p className="text-[11px] text-indigo-400 mt-0.5">
                    {row.txCode}
                  </p>
                </td>

                {/* Taxable Base */}
                <td className="py-4 px-4 text-right text-gray-600 text-[13px]">
                  {fmtRs(row.taxableBase)}
                </td>

                {/* Rate */}
                <td className="py-4 px-4 text-center text-gray-600 text-[13px]">
                  {row.rate}%
                </td>

                {/* VAT Collected */}
                <td className="py-4 px-4 text-right">
                  <span className="font-bold text-gray-900 text-[13px]">
                    {fmtRs(row.vatCollected)}
                  </span>
                </td>

                {/* VAT Paid */}
                <td className="py-4 px-4 text-right text-indigo-500 text-[13px] font-medium">
                  {fmtRs(row.vatPaid)}
                </td>

                {/* Remitted */}
                <td className="py-4 px-4 text-right">
                  <span
                    className={`text-[13px] font-semibold ${
                      row.remitted > 0 ? "text-green-600" : "text-green-500"
                    }`}
                  >
                    {row.remitted > 0 ? fmtRs(row.remitted) : fmtRs(0)}
                  </span>
                </td>

                {/* Still Owed */}
                <td className="py-4 px-4 text-right">
                  <span
                    className={`text-[13px] font-bold ${
                      row.stillOwed > 0 ? "text-red-500" : "text-red-400"
                    }`}
                  >
                    {row.stillOwed > 0 ? fmtRs(row.stillOwed) : fmtRs(0)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-4 text-center">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">Showing {sorted.length} periods</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">
            Total VAT Collected:{" "}
            <span className="font-bold text-gray-700">
              {fmtRs(sorted.reduce((s, r) => s + r.vatCollected, 0))}
            </span>
          </span>
          <span className="text-gray-400">
            Total Remitted:{" "}
            <span className="font-bold text-green-600">
              {fmtRs(sorted.reduce((s, r) => s + r.remitted, 0))}
            </span>
          </span>
          <span className="text-gray-400">
            Still Owed:{" "}
            <span className="font-bold text-red-500">
              {fmtRs(sorted.reduce((s, r) => s + r.stillOwed, 0))}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
