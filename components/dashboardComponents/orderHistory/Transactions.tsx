"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { Transaction } from "./transaction-columns";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import TransactionDetailModal from "./TransactionDetailModal";
import { statusStyles, paymentMethods } from "@/lib/config/transaction";
import { formatCurrency } from "@/utils/helper";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function Transactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { currency } = useCurrency();

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const pageSize = 10;

  const handleRowClick = async (row: Transaction) => {
    const invoiceNo = parseInt(row.id.replace("ORD-", ""), 10);
    setModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const detail = await getTransactionDetail(invoiceNo);
      setSelectedTransaction(detail);
    } catch (err) {
      console.error("Failed to load transaction detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filtered = useMemo(() => {
    let result = transactions;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.invoiceName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (paymentFilter !== "all") {
      result = result.filter((t) => t.paymentMethod === paymentFilter);
    }
    return result;
  }, [transactions, search, statusFilter, paymentFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aRaw = (a as Record<string, unknown>)[sortConfig.key];
      const bRaw = (b as Record<string, unknown>)[sortConfig.key];
      const aVal = String(aRaw ?? "");
      const bVal = String(bRaw ?? "");
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
    <div className="py-2">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
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
            placeholder="Search by customer or order ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="all">All Payment</option>
          <option value="Card">Card</option>
          <option value="Cash">Cash</option>
          <option value="Loyalty">Loyalty</option>
          <option value="QR">QR</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("id")}
              >
                <span className="flex items-center gap-1">
                  Order ID {SortIcon({ colKey: "id" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("timestamp")}
              >
                <span className="flex items-center gap-1">
                  Date / Time {SortIcon({ colKey: "timestamp" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("invoiceName")}
              >
                <span className="flex items-center gap-1">
                  Customer {SortIcon({ colKey: "invoiceName" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Payment
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Total {SortIcon({ colKey: "amount" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              paged.map((transaction, idx) => {
                const s = statusStyles[transaction.status];
                const p = paymentMethods[transaction.paymentMethod];
                return (
                  <tr
                    key={transaction.id}
                    onClick={() => handleRowClick(transaction)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        {transaction.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800 text-xs block">
                        {transaction.timestamp}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {transaction.date}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900">
                        {transaction.invoiceName || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(Number(transaction.amount), currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${s.badge} ${s.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">
          Page {page + 1} of {totalPages} · {sorted.length} transactions
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>

      <TransactionDetailModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        isLoading={isLoadingDetail}
        currency={currency}
      />
    </div>
  );
}
