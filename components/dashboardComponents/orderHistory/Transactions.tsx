"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { Transaction } from "./transaction-columns";
// import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import TransactionDetailModal from "./TransactionDetailModal";
import { statusStyles, paymentMethods } from "@/lib/config/transaction";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

// ── Refund confirmation modal ─────────────────────────────────────────────

const RefundModal = ({
  open,
  transaction,
  onClose,
  onConfirm,
  isRefunding,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
  isRefunding: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-base font-semibold">
            Refund Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-1 py-1">
          <p className="text-sm text-gray-600">
            Are you sure you want to refund{" "}
            <span className="font-semibold text-gray-900">
              {transaction?.id}
            </span>
            ?
          </p>
          {transaction && (
            <p className="text-xs text-gray-400">
              Customer: {transaction.invoiceName || "—"} · {transaction.amount}
            </p>
          )}
          <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRefunding}
            className="text-sm rounded-lg flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isRefunding}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg flex-1"
          >
            {isRefunding ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                Refunding...
              </span>
            ) : (
              "Confirm Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main table ────────────────────────────────────────────────────────────

export default function Transactions({
  transactions: initialTransactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const { currency } = useCurrency();

  // Local copy so we can optimistically update status
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const pageSize = 10;

  // ── Refund handler ──────────────────────────────────────────────────────

  const handleRefund = async () => {
    if (!refundTarget) return;

    const invoiceNo = refundTarget.invoiceNo;
    setIsRefunding(true);

    try {
      const res = await fetch(`/api/tickets/${invoiceNo}/refund`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Refund failed");
      }

      // ── Optimistically update status in local state ─────────────────────
      setTransactions((prev) =>
        prev.map((t) =>
          t.invoiceNo === invoiceNo ? { ...t, status: "refunded" } : t,
        ),
      );

      toast.success(`Order ${refundTarget.id} refunded successfully`);
      setRefundTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refund transaction",
      );
    } finally {
      setIsRefunding(false);
    }
  };

  // ── Filters + sort ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = transactions;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.invoiceName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.customer?.name?.toLowerCase().includes(q) ?? false),
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
      const aVal = String((a as Record<string, unknown>)[sortConfig.key] ?? "");
      const bVal = String((b as Record<string, unknown>)[sortConfig.key] ?? "");
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
      {/* Hide scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
          <option value="QR">QR</option>
        </select>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[1000px]">
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
                  Bill ID {SortIcon({ colKey: "id" })}
                </span>
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
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Invoice Name
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
              {/* ── New actions column ── */}
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              paged.map((transaction, idx) => {
                const s =
                  statusStyles[transaction.status] ?? statusStyles["pending"];
                const p =
                  paymentMethods[transaction.paymentMethod] ??
                  paymentMethods["Cash"];
                const isRefunded = transaction.status === "refunded";

                return (
                  <tr
                    key={transaction.id}
                    onClick={() =>
                      router.push(`/invoices/${transaction?.invoiceNo}`)
                    }
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-gray-900">
                        BILL-{transaction.billNo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-gray-900">
                        ORD-{transaction.invoiceNo}
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
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {transaction.invoiceName || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {transaction.customer?.name || "—"}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {transaction.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-xs text-gray-900">
                      {/* {formatCurrency(Number(transaction.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(transaction.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${s.badge} ${s.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </span>
                    </td>

                    {/* ── Actions cell ── */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isRefunded ? (
                        <span className="text-xs text-gray-400 italic">
                          Refunded
                        </span>
                      ) : (
                        <button
                          onClick={() => setRefundTarget(transaction)}
                          title="Refund this transaction"
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-orange-400 hover:bg-orange-500 hover:text-white rounded-lg  transition-colors hover:cursor-pointer"
                        >
                          Refund
                          <RotateCcw size={12} />
                        </button>
                      )}
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
          Page {page + 1} of {totalPages} · {sorted.length} transactions
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

      {/* Refund confirmation modal */}
      <RefundModal
        open={!!refundTarget}
        transaction={refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        isRefunding={isRefunding}
      />
    </div>
  );
}
