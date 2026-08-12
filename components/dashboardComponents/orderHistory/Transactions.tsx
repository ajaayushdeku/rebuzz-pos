"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { Transaction } from "./transaction-columns";
// import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
import TransactionDetailModal from "./TransactionDetailModal";
import RefundModal from "./RefundModal";
import { statusStyles, paymentMethods } from "@/lib/config/transaction";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime } from "../staffDash/staffDetail/staffDetailHelpers";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

/** Relative "time ago" label: moments / min / hours / days ago. */
function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "moments ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
type SortConfig = { key: string; direction: "asc" | "desc" } | null;
type TabKey = "completed" | "refunded" | "all";

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
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  // Close the payment dropdown on outside click / Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        paymentRef.current &&
        !paymentRef.current.contains(e.target as Node)
      ) {
        setPaymentOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaymentOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Status is now driven by the tabs instead of a select
  const [activeTab, setActiveTab] = useState<TabKey>("completed");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  // Everything except the status tab — the tab counts are derived from this,
  // so they stay honest while a search or payment filter is applied.
  const scoped = useMemo(() => {
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
    if (paymentFilter !== "all") {
      result = result.filter((t) => t.paymentMethod === paymentFilter);
    }
    return result;
  }, [transactions, search, paymentFilter]);

  const counts = useMemo(
    () => ({
      completed: scoped.filter((t) => t.status === "completed").length,
      refunded: scoped.filter((t) => t.status === "refunded").length,
      all: scoped.length,
    }),
    [scoped],
  );

  const filtered = useMemo(
    () =>
      activeTab === "all"
        ? scoped
        : scoped.filter((t) => t.status === activeTab),
    [scoped, activeTab],
  );

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

  // ── Tabs ────────────────────────────────────────────────────────────────

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "completed", label: "Paid", count: counts.completed },
    { key: "refunded", label: "Refunded", count: counts.refunded },
    { key: "all", label: "All", count: counts.all },
  ];

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    setPage(0);
  };

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === activeTab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    selectTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const emptyMessage =
    activeTab === "refunded"
      ? "No refunded transactions"
      : activeTab === "completed"
        ? "No completed transactions"
        : "No transactions found";

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

      {/* ── Tabs — the rule runs edge to edge and the pill sits on top ── */}
      <div className="relative flex justify-center my-4">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
        />
        <div
          role="tablist"
          aria-label="Transaction status"
          onKeyDown={handleTabKeyDown}
          className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
        >
          {tabs.map((tab, i) => {
            const selected = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`transactions-tab-${tab.key}`}
                aria-selected={selected}
                aria-controls="transactions-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.key)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                  selected
                    ? "bg-white font-bold text-blue-950 shadow-sm"
                    : "font-semibold text-blue-800 hover:text-blue-950"
                }`}
              >
                {tab.label}
                <span className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 bg-[#e4f2fe]  text-blue-950 ring-blue-900">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filters — stay put across tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8 mb-4">
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
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div ref={paymentRef} className="relative w-full sm:w-[160px]">
          <button
            type="button"
            onClick={() => setPaymentOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition"
          >
            <span>
              {paymentFilter === "all" ? "All Payment" : paymentFilter}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${
                paymentOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute z-30 mt-1.5 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
              paymentOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            }`}
          >
            {[
              { value: "all", label: "All Payment" },
              { value: "Card", label: "Card" },
              { value: "Cash", label: "Cash" },
              { value: "QR", label: "QR" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setPaymentFilter(opt.value);
                  setPage(0);
                  setPaymentOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
                  paymentFilter === opt.value
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div
        id="transactions-panel"
        role="tabpanel"
        aria-labelledby={`transactions-tab-${activeTab}`}
        className="bg-white overflow-x-auto scrollbar-hide focus-visible:outline-none"
      >
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
                  colSpan={10}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Receipt size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Transactions will appear here.
                    </p>
                  </div>
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
                const billDate = parseNepalDateTime(transaction.paidAt ?? "");

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
                      <span className="font-semibold text-xs text-gray-900 block">
                        BILL-{transaction.billNo}
                      </span>
                      {billDate && (
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(billDate)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-gray-900">
                        ORD-{transaction.invoiceNo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800 text-xs block">
                        {transaction.timestamp}
                        {transaction.timestamp12h && (
                          <span className="text-[10px] font-normal text-gray-400">
                            {"  "}[ {transaction.timestamp12h} ]
                          </span>
                        )}
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
                          className="p-1.5 text-xs flex flex-row items-center gap-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors hover:cursor-pointer tracking-wide font-medium"
                        >
                          Refund <RotateCcw size={12} />
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
