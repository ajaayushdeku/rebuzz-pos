"use client";

import { useState, useMemo, useCallback, useRef } from "react";

import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  TrendingDown,
  TrendingUp,
  RepeatIcon,
  Search,
  Trash2,
  Pencil,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Receipt,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getPurposeColor,
  useTracker,
  type Transaction,
} from "@/providers/ExpenseContext";
import ExpenseIncomeForm from "./ExpenseIncomeForm";
import { ComponentHeader } from "../ComponentHeader";

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type TabKey = "expense" | "income" | "all";

const SortIcon = ({
  colKey,
  sort,
  sortDir,
}: {
  colKey: SortKey;
  sort: SortKey;
  sortDir: SortDir;
}) =>
  sort === colKey ? (
    sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  ) : (
    <ArrowUpDown className="h-3 w-3 opacity-30" />
  );

export default function RecentTransactions() {
  const { transactions, deleteTransaction, allPurposes } = useTracker();
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TabKey>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Edit state
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map purposeId → { name, icon } (from the purpose fetch API via context)
  const purposeLookup = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    for (const p of allPurposes) {
      map[p._id] = { name: p.name, icon: p.icon };
    }
    return map;
  }, [allPurposes]);

  const getPurposeName = useCallback(
    (purposeId: string) => purposeLookup[purposeId]?.name ?? purposeId,
    [purposeLookup],
  );

  const getPurposeIconStr = useCallback(
    (purposeId: string) => purposeLookup[purposeId]?.icon ?? "public",
    [purposeLookup],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteTarget._id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setSortDir("desc");
    }
  };

  // Search only — the tab counts come off this, so they respond to the search box
  const searched = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.remark.toLowerCase().includes(q) ||
        getPurposeName(t.purposeId).toLowerCase().includes(q),
    );
  }, [transactions, search, getPurposeName]);

  const counts = useMemo(
    () => ({
      expense: searched.filter((t) => t.kind === "expense").length,
      income: searched.filter((t) => t.kind === "income").length,
      all: searched.length,
    }),
    [searched],
  );

  const filtered = useMemo(() => {
    return searched
      .filter((t) => filter === "all" || t.kind === filter)
      .sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        if (sort === "date")
          return (
            mul * (new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        return mul * (a.amount - b.amount);
      });
  }, [searched, filter, sort, sortDir]);

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "expense", label: "Expense", count: counts.expense },
    { key: "income", label: "Income", count: counts.income },
    { key: "all", label: "All", count: counts.all },
  ];

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === filter);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    setFilter(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const emptyLabel =
    filter === "all" ? "No transaction found" : `No ${filter} found`;

  return (
    <div className="bg-white  p-5">
      {/* ── Header: title ── */}
      <div className="flex flex-col sm:flex-row items-center  mb-4">
        <ComponentHeader
          title="Recent Transactions"
          subHeader="View your recent financial transactions"
        />
      </div>

      {/* ── Tabs — the rule runs edge to edge and the pill sits on top ── */}
      <div className="relative flex justify-center mb-4">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
        />
        <div
          role="tablist"
          aria-label="Transaction kind"
          onKeyDown={handleTabKeyDown}
          className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
        >
          {tabs.map((tab, i) => {
            const selected = tab.key === filter;

            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`recent-tab-${tab.key}`}
                aria-selected={selected}
                aria-controls="recent-transactions-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                  selected
                    ? "bg-white font-bold text-blue-950 shadow-sm"
                    : "font-semibold text-blue-800 hover:text-blue-950"
                }`}
              >
                {tab.label}
                <span className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 bg-[#e4f2fe] text-blue-950 ring-blue-900">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex-1 my-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by remarks or purpose..."
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* ── Table ── */}
      <div
        id="recent-transactions-panel"
        role="tabpanel"
        aria-labelledby={`recent-tab-${filter}`}
        className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium">Details</th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Purpose</th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("date")}
              >
                <span className="flex items-center gap-1">
                  Date <SortIcon colKey="date" sort={sort} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Amount{" "}
                  <SortIcon colKey="amount" sort={sort} sortDir={sortDir} />
                </span>
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Receipt size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {emptyLabel}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      All recent transaction will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isExpense = t.kind === "expense";
                const Icon = isExpense ? TrendingDown : TrendingUp;
                const color = isExpense ? "text-red-500" : "text-green-500";
                const bg = isExpense ? "bg-red-50" : "bg-green-50";

                return (
                  <tr
                    key={t._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <Icon size={13} className={color} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {t.remark || "—"}
                          </p>
                          {t.isRecurring && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <RepeatIcon size={9} className="text-blue-400" />
                              <span className="text-[10px] text-blue-400 capitalize">
                                {t.frequency || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-3 px-4">
                      {(() => {
                        const purposeName = getPurposeName(t.purposeId);
                        const iconStr = getPurposeIconStr(t.purposeId);
                        const iconColor = getPurposeColor(iconStr, purposeName);
                        return (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: iconColor + "20",
                              color: iconColor,
                            }}
                          >
                            {purposeName}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {t.date}
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-4 text-right text-xs font-semibold ${color}`}
                    >
                      {isExpense ? "− " : "+ "}
                      {formatCurrencySymbol(
                        t.amount,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTransaction(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ── Delete confirmation modal ── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={!isDeleting}>
          <DialogHeader>
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-base font-semibold text-center text-gray-900">
              Delete transaction?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              {deleteTarget
                ? `“${deleteTarget.remark || getPurposeName(deleteTarget.purposeId)}” will be permanently removed. This action cannot be undone.`
                : "This transaction will be permanently removed. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit transaction form ── */}
      <ExpenseIncomeForm
        editTransaction={editTransaction}
        offAddExpense={true}
        onEditSuccess={() => setEditTransaction(null)}
      />
    </div>
  );
}
