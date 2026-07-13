"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreditPaymentModal from "@/components/credit/CreditPaymentModal";
import type { Credit } from "@/services/apiCredit.client";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

/** Date part of "2026-07-13 14:53:38.595" → "2026-07-13". */
const dateOnly = (raw: string) =>
  raw ? (raw.includes(" ") ? raw.split(" ")[0] : raw.split("T")[0]) : "—";

export default function CreditsTable({ credits }: { credits: Credit[] }) {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<Credit | null>(null);
  const pageSize = 10;

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
      </div>

      {/* Table */}
      <div className="bg-white overflow-x-auto">
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
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Unpaid by customer
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("dueAmount")}
              >
                <span className="flex items-center gap-1">
                  Amount due {SortIcon({ colKey: "dueAmount" })}
                </span>
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No credits found
                </td>
              </tr>
            ) : (
              paged.map((c) => {
                const cleared = (c.dueAmount ?? 0) <= 0;
                const ubc = unpaidByCustomer.get(c._id);
                return (
                  <tr
                    key={c._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border capitalize ${
                          cleared
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {cleared ? "Paid" : (c.status ?? "Ongoing")}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-700">
                      {dateOnly(c.creationDate)}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 text-gray-800">
                      {c.user?.name ?? "—"}
                    </td>

                    {/* Unpaid by customer */}
                    <td className="py-3.5 px-4 text-gray-500">
                      {ubc && ubc.total > 1
                        ? `${ubc.ordinal} of ${ubc.total}`
                        : ""}
                    </td>

                    {/* Amount due */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {fmt(c.dueAmount ?? 0)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {cleared ? (
                          <span className="text-xs text-gray-400 font-medium">
                            Settled
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => setPaymentTarget(c)}
                              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                            >
                              Record payment
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  title="Actions"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl p-1.5"
                              >
                                <DropdownMenuItem
                                  className="rounded-lg"
                                  onSelect={() => setPaymentTarget(c)}
                                >
                                  Record payment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
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
    </>
  );
}
