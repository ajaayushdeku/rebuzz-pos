"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Invoice } from "@/lib/types/invoice";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatDatetime } from "@/utils/helper";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { parseNepalDateTime } from "../dashboardComponents/staffDash/staffDetail/staffDetailHelpers";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function ArchivedInvoicesTable({
  invoices,
  isLoading,
}: {
  invoices: Invoice[];
  isLoading: boolean;
}) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [restoreTarget, setRestoreTarget] = useState<Invoice | null>(null);
  const [restoring, setRestoring] = useState(false);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const invoiceList = Array.isArray(invoices) ? invoices : [];
    return invoiceList.filter((inv) => {
      const matchSearch =
        !search ||
        String(inv.invoice).includes(q) ||
        (inv.customer_name ?? "").toLowerCase().includes(q) ||
        (inv.ticket_name ?? "").toLowerCase().includes(q);
      return matchSearch;
    });
  }, [invoices, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    if (!Array.isArray(filtered)) return [];
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

  const handleRestore = async () => {
    if (!restoreTarget?.invoice) return;
    setRestoring(true);
    try {
      const res = await fetch(
        `/api/invoices/${restoreTarget.invoice}/unarchive`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to restore invoice",
        );
      }
      toast.success("Invoice restored successfully");
      setRestoreTarget(null);
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to restore invoice",
      );
    } finally {
      setRestoring(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );

  return (
    <>
      <div className="bg-white ">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Archived Invoices
        </h2>

        {/* Hide scrollbar styles */}
        <style jsx global>{`
          .scrollbar-hide {
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Search */}
        <div className="relative mb-4">
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
            placeholder="Search archived invoices..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[900px]">
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
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Customer
                </th>
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
                    Archived Date {SortIcon({ colKey: "created_at" })}
                  </span>
                </th>
                <th className="text-right pb-3 pt-3 px-4 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-sm text-gray-400"
                  >
                    No archived invoices found
                  </td>
                </tr>
              ) : (
                paged.map((inv, idx) => {
                  const invoiceArchivedDate = parseNepalDateTime(
                    inv.archivedAt || inv.created_at,
                  );
                  return (
                    <tr
                      key={inv.invoice}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
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
                        {formatCurrencySymbol(
                          Number(inv.amount),
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {/* {formatDatetime(inv.archivedAt || inv.created_at)} */}

                        <span className="font-medium text-gray-800 text-xs block">
                          {invoiceArchivedDate?.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {invoiceArchivedDate?.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setRestoreTarget(inv)}
                            className="p-1.5 text-xs flex flex-row items-center gap-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors hover:cursor-pointer"
                            title="Restore invoice"
                          >
                            Unarchive <RotateCcw className="h-3.5 w-3.5" />
                          </button>
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
        {totalPages > 1 && (
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
              Page {page + 1} of {totalPages} · {sorted.length} archived
              invoices
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
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  p-4"
          onClick={() => setRestoreTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Restore Invoice?
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                This will restore invoice{" "}
                <span className="font-medium text-gray-700">
                  ORD-{restoreTarget.invoice}
                </span>{" "}
                back to the active invoices list.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRestoreTarget(null)}
                disabled={restoring}
                className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={restoring}
                className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                {restoring ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </span>
                ) : (
                  "Restore"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
