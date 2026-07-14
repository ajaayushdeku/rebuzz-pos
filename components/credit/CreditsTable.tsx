"use client";

import { useState, useMemo, Fragment } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime } from "@/components/dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreditPaymentModal from "@/components/credit/CreditPaymentModal";
import CreditPaymentHistory from "@/components/credit/CreditPaymentHistory";
import { archiveCredit, type Credit } from "@/services/apiCredit.client";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function CreditsTable({
  credits,
  actionsMode = "full",
  creditStatus,
  showStatusFilter = true,
}: {
  credits: Credit[];
  /** full = every action, delete-only = only Delete, none = no Actions column */
  actionsMode?: "full" | "delete-only" | "none";
  creditStatus?: "completed" | "archived";
  showStatusFilter?: boolean;
}) {
  const colCount = actionsMode === "none" ? 7 : 8;
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<Credit | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Credit | null>(null);
  const [archiving, setArchiving] = useState(false);
  const pageSize = 10;

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveCredit(archiveTarget._id);
      toast.success("Credit deleted");
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      setArchiveTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete credit",
      );
    } finally {
      setArchiving(false);
    }
  };

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(credits.map((c) => (c.status ?? "").toLowerCase())),
      ).filter(Boolean),
    [credits],
  );

  // "X of Y" per customer — ordinal of this credit among the customer's
  // UNPAID credits (due remaining). Settled credits are excluded.
  const unpaidByCustomer = useMemo(() => {
    const byUser = new Map<string, Credit[]>();
    for (const c of credits) {
      if ((c.dueAmount ?? 0) <= 0) continue; // only unpaid credits count
      const uid = c.user?._id ?? "unknown";
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(c);
    }
    const map = new Map<string, { ordinal: number; total: number }>();
    for (const list of byUser.values()) {
      const ordered = [...list].sort((a, b) =>
        a.creationDate.localeCompare(b.creationDate),
      );
      ordered.forEach((c, i) =>
        map.set(c._id, { ordinal: i + 1, total: ordered.length }),
      );
    }
    return map;
  }, [credits]);

  const filtered = useMemo(() => {
    return credits.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search || (c.user?.name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (c.status ?? "").toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [credits, search, statusFilter]);

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
            placeholder="Search by customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        {showStatusFilter && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600 capitalize"
          >
            <option value="all">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium">Status</th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("creationDate")}
              >
                <span className="flex items-center gap-1">
                  Date {SortIcon({ colKey: "creationDate" })}
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Number</th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              {creditStatus !== "completed" && creditStatus !== "archived" && (
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Unpaid by Customer
                </th>
              )}
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("grandTotal")}
              >
                <span className="flex items-center gap-1">
                  Total Credit {SortIcon({ colKey: "grandTotal" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("dueAmount")}
              >
                <span className="flex items-center gap-1">
                  Amount due {SortIcon({ colKey: "dueAmount" })}
                </span>
              </th>
              {actionsMode !== "none" && (
                <th className="text-right pb-3 pt-3 px-4 font-medium">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No credits found
                </td>
              </tr>
            ) : (
              paged.map((c) => {
                const cleared = (c.dueAmount ?? 0) <= 0;
                const ubc = unpaidByCustomer.get(c._id);
                const isExpanded = expandedId === c._id;
                return (
                  <Fragment key={c._id}>
                    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-semibold border capitalize relative overflow-hidden ${
                            c.status === "archived"
                              ? "text-gray-600 border-gray-300"
                              : cleared
                                ? "text-green-700 border-green-200"
                                : "text-red-700 border-red-200"
                          }`}
                          style={
                            c.status === "archived"
                              ? {
                                  backgroundImage:
                                    "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156, 163, 175, 0.2) 2px, rgba(156, 163, 175, 0.2) 4px)",
                                  backgroundColor: "rgba(156, 163, 175, 0.3)",
                                }
                              : cleared
                                ? {
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(134, 239, 172, 0.2) 2px, rgba(134, 239, 172, 0.2) 4px)",
                                    backgroundColor: "rgba(134, 239, 172, 0.3)",
                                  }
                                : {
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(252, 165, 165, 0.2) 2px, rgba(252, 165, 165, 0.2) 4px)",
                                    backgroundColor: "rgba(252, 165, 165, 0.3)",
                                  }
                          }
                        >
                          {cleared && c.status === "completed"
                            ? "Paid"
                            : c.status === "archived"
                              ? "Archived"
                              : c.status === "ongoing" && "Ongoing"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const d = parseNepalDateTime(c.creationDate);
                          return d ? (
                            <div>
                              <span className="font-medium text-gray-800 text-xs block">
                                {d.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {d.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          );
                        })()}
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 text-xs text-gray-800">
                        {c.invoiceNo ?? "—"}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 text-xs text-gray-800">
                        {c.user?.name ?? "—"}
                      </td>

                      {/* Unpaid by customer (hidden for completed/archived) */}
                      {creditStatus !== "archived" &&
                        creditStatus !== "completed" && (
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {!cleared &&
                            !(c.status === "archived") &&
                            ubc &&
                            ubc.total > 1
                              ? `${ubc.ordinal} of ${ubc.total}`
                              : ""}
                          </td>
                        )}
                      {/* Total Credit */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                        {fmt(c.grandTotal ?? 0)}
                      </td>

                      {/* Amount due */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-red-900">
                        {fmt(c.dueAmount ?? 0)}
                      </td>

                      {/* Actions */}
                      {actionsMode !== "none" && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
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
                                className="w-44 rounded-xl p-1.5"
                              >
                                {actionsMode === "full" && (
                                  <>
                                    {/* View */}
                                    <DropdownMenuItem className="rounded-lg">
                                      View
                                    </DropdownMenuItem>

                                    {/* View payment history */}
                                    <DropdownMenuItem
                                      className="rounded-lg"
                                      onSelect={() =>
                                        setExpandedId((prev) =>
                                          prev === c._id ? null : c._id,
                                        )
                                      }
                                    >
                                      {isExpanded
                                        ? "Hide payment history"
                                        : "View payment history"}
                                    </DropdownMenuItem>

                                    {!cleared && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="rounded-lg"
                                          onSelect={() => setPaymentTarget(c)}
                                        >
                                          Record payment
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {/* Resend invoice */}
                                    <DropdownMenuItem className="rounded-lg">
                                      Resend invoice
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {/* Export as PDF */}
                                    <DropdownMenuItem className="rounded-lg">
                                      Export as PDF
                                    </DropdownMenuItem>

                                    {/* Print */}
                                    <DropdownMenuItem className="rounded-lg">
                                      Print
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                  </>
                                )}

                                {/* Delete */}
                                <DropdownMenuItem
                                  className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onSelect={() => setArchiveTarget(c)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      )}
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={colCount} className="px-4 pb-3">
                          <CreditPaymentHistory creditId={c._id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
          Page {page + 1} of {totalPages} · {sorted.length} credits
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

      {/* Record Payment Modal */}
      <CreditPaymentModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        credit={paymentTarget}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["credits"] })
        }
      />

      {/* Delete (archive) confirmation */}
      {archiveTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !archiving && setArchiveTarget(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Delete credit
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    {archiveTarget.user?.name || "This credit"} · will be
                    archived
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 text-sm text-gray-600">
                Are you sure you want to delete this credit? This moves it to
                the archived list.
              </div>

              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={() => setArchiveTarget(null)}
                  disabled={archiving}
                  className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {archiving ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
