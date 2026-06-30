"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  // Eye,
  // Wallet,
  // Pencil,
  // Copy,
  // Send,
  // FileText,
  // Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Invoice } from "@/lib/types/invoice";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatDatetime } from "@/utils/helper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RecordPaymentModal from "@/components/invoice/modals/RecordPaymentModal";
import ExportPdfModal from "@/components/invoice/modals/ExportPdfModal";
import PrintInvoiceModal from "@/components/invoice/modals/PrintInvoiceModal";
import toast from "react-hot-toast";
import { parseNepalDateTime } from "../dashboardComponents/staffDash/staffDetail/staffDetailHelpers";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  unpaid: "bg-red-100 text-red-700 border-red-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  overdue: "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_FILTER_OPTIONS = ["paid", "unpaid"];

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const { currency } = useCurrency();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        String(inv.invoice).includes(q) ||
        (inv.customer_name ?? "").toLowerCase().includes(q) ||
        (inv.ticket_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (inv.status ?? "").toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  // ── Resend invoice (send reminder) ────────────────────────────────────────
  const handleResend = async (invoice: number | string | undefined) => {
    if (invoice === undefined || invoice === null || invoice === "") return;
    await toast.promise(
      (async () => {
        const res = await fetch(`/api/tickets/${invoice}/send`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || "Failed to resend invoice",
          );
        }
      })(),
      {
        loading: "Resending invoice...",
        success: `Invoice ORD-${invoice} resent`,
        error: (err) =>
          err instanceof Error ? err.message : "Failed to resend invoice",
      },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600 capitalize"
        >
          <option value="all">All Status</option>
          {STATUS_FILTER_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white  overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("invoice")}
              >
                <span className="flex items-center gap-1">
                  Invoice # {SortIcon({ colKey: "invoice" })}
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Invoice Name
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              <th
                className="flex items-center pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Amount {SortIcon({ colKey: "amount" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("created_at")}
              >
                <span className="flex items-center gap-1">
                  Date {SortIcon({ colKey: "created_at" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Status</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              paged.map((inv, idx) => {
                const status = (inv.status ?? "").toLowerCase();
                const invoiceDate = parseNepalDateTime(inv.created_at);
                return (
                  <tr
                    key={inv.invoice}
                    onClick={() => router.push(`/invoices/${inv.invoice}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-xs text-gray-900">
                        ORD-{inv.invoice}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {inv.ticket_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {inv.customer_name ?? "—"}
                    </td>

                    <td className="py-3 px-4 text-xs text-left font-semibold text-gray-900">
                      {/* {formatCurrency(Number(inv.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(inv.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {invoiceDate ? (
                        <div>
                          <span className="font-medium text-gray-800 text-xs block">
                            {invoiceDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {invoiceDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4  text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {inv.status ?? "—"}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              title="Actions"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5"
                          >
                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() =>
                                router.push(`/invoices/${inv.invoice}`)
                              }
                            >
                              {/* <Eye className="h-4 w-4" /> */}
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() =>
                                router.push(`/invoices/${inv.invoice}/edit`)
                              }
                            >
                              {/* <Pencil className="h-4 w-4" /> */}
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg">
                              {/* <Copy className="h-4 w-4" /> */}
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() => setPaymentTarget(inv)}
                            >
                              {/* <Wallet className="h-4 w-4" /> */}
                              Record payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() => handleResend(inv.invoice)}
                            >
                              {/* <Send className="h-4 w-4" /> */}
                              Resend invoice
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() => setExportTarget(inv)}
                            >
                              {/* <FileText className="h-4 w-4" /> */}
                              Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onSelect={() => setPrintTarget(inv)}
                            >
                              {/* <Printer className="h-4 w-4" /> */}
                              Print
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
                              onSelect={() => setDeleteTarget(inv)}
                            >
                              {/* <Trash2 className="h-4 w-4 text-red-600" /> */}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium">
          Page {page + 1} of {totalPages} · {sorted.length} invoices
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Invoice?
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. The invoice{" "}
                <span className="font-medium text-gray-700">
                  ORD-{deleteTarget.invoice}
                </span>{" "}
                will be permanently removed.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(
                      `/api/invoices/${deleteTarget.invoice}/archive`,
                      {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                      },
                    );
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(
                        (data as { error?: string }).error ||
                          "Failed to delete invoice",
                      );
                    }
                    toast.success("Invoice deleted successfully");
                    setDeleteTarget(null);
                    window.location.reload();
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to delete invoice",
                    );
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        invoiceNo={paymentTarget?.invoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["invoice"] });
          queryClient.invalidateQueries({ queryKey: ["archived-invoices"] });
        }}
      />

      {/* Export as PDF Modal */}
      <ExportPdfModal
        open={!!exportTarget}
        onClose={() => setExportTarget(null)}
        invoiceNo={exportTarget?.invoice}
      />

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        open={!!printTarget}
        onClose={() => setPrintTarget(null)}
        invoiceNo={printTarget?.invoice}
      />
    </>
  );
}
