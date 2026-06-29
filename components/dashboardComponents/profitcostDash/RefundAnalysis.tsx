"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRefundAnalysis } from "@/hooks/useRefundAnalysis";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

function renderSortIcon(colKey: string, sortConfig: SortConfig) {
  if (sortConfig?.key === colKey) {
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
}

export default function RefundAnalysis({
  refundReasons: initialData,
  startDate,
  endDate,
}: {
  refundReasons?: {
    name: string;
    loss: number;
    invoiceNo: number;
    updatedAt: string;
    createdAt: string;
  }[];
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Fetch data via React Query hook, driven by the global date range
  const { data: fetchedData, isFetching } = useRefundAnalysis(
    startDate,
    endDate,
  );
  const refundReasons = fetchedData ?? initialData ?? [];

  const filtered = useMemo(() => {
    if (!search) return refundReasons;
    const q = search.toLowerCase();
    return refundReasons.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || String(r.invoiceNo).includes(q),
    );
  }, [refundReasons, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key] ?? "";
      const bVal = (b as Record<string, unknown>)[sortConfig.key] ?? "";
      const aNum = typeof aVal === "number" ? aVal : parseFloat(String(aVal));
      const bNum = typeof bVal === "number" ? bVal : parseFloat(String(bVal));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === "asc") {
        return { key, direction: "desc" as const };
      }
      return { key, direction: "asc" as const };
    });
    setPage(0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <div className="min-w-0 mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Refund Analysis
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          All the refunded bills with lost value.
        </p>
      </div>

      {/* Search */}
      <div className="flex  justify-between items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search refunds..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black-300 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Bill Name {renderSortIcon("name", sortConfig)}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("createdAt")}
              >
                <span className="flex items-center gap-1">
                  Bill Date {renderSortIcon("createdAt", sortConfig)}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("updatedAt")}
              >
                <span className="flex items-center gap-1">
                  Refund Date {renderSortIcon("updatedAt", sortConfig)}
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("loss")}
              >
                <span className="flex items-center justify-end gap-1">
                  Value Lost {renderSortIcon("loss", sortConfig)}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No refunds found
                </td>
              </tr>
            ) : (
              paged.map((item, idx) => (
                <tr
                  key={item.invoiceNo}
                  onClick={() => router.push(`/invoices/${item.invoiceNo}`)}
                  className="border-b border-gray-50 last:border-0 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-xs text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">
                      #{item.invoiceNo}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-gray-500 text-xs">
                      {formatDate(item.createdAt)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-gray-500 text-xs">
                      {formatDate(item.updatedAt)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-xs text-red-600">
                    {/* -{formatCurrency(item.loss, currency)} */}-
                    {formatCurrencySymbol(
                      item.loss,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>
                </tr>
              ))
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
          Page {page + 1} of {totalPages} · {sorted.length} refund entries
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
    </div>
  );
}
