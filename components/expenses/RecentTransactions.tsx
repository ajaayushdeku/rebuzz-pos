"use client";

import { useState, useMemo, useCallback } from "react";

import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  TrendingDown,
  TrendingUp,
  RepeatIcon,
  Search,
  Trash2,
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

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";

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
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchType = filter === "all" || t.kind === filter;
        const matchSearch =
          !search ||
          t.remark.toLowerCase().includes(search.toLowerCase()) ||
          getPurposeName(t.purposeId)
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchType && matchSearch;
      })
      .sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        if (sort === "date")
          return (
            mul * (new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        return mul * (a.amount - b.amount);
      });
  }, [transactions, filter, search, sort, sortDir]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* ── Header: title + filter tabs + search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Recent Transactions
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "expense", "income"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by remarks or purpose..."
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                      No transaction found
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
    </div>
  );
}
