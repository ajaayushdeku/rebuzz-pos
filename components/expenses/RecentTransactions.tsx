"use client";

import { useState, useMemo } from "react";

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
} from "lucide-react";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";

export default function RecentTransactions() {
  const { transactions, deleteTransaction } = useTracker();
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) =>
    sort === colKey ? (
      sortDir === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchType = filter === "all" || t.type === filter;
        const matchSearch =
          !search ||
          t.remarks.toLowerCase().includes(search.toLowerCase()) ||
          t.purpose.toLowerCase().includes(search.toLowerCase());
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
                  Date <SortIcon colKey="date" />
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Amount <SortIcon colKey="amount" />
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
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isExpense = t.type === "expense";
                const Icon = isExpense ? TrendingDown : TrendingUp;
                const color = isExpense ? "text-red-500" : "text-green-500";
                const bg = isExpense ? "bg-red-50" : "bg-green-50";

                return (
                  <tr
                    key={t.id}
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
                            {t.remarks || "—"}
                          </p>
                          {t.recurring && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <RepeatIcon size={9} className="text-blue-400" />
                              <span className="text-[10px] text-blue-400 capitalize">
                                {t.frequency}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-3 px-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            (PURPOSE_COLORS[t.purpose] ?? "#6b7280") + "20",
                          color: PURPOSE_COLORS[t.purpose] ?? "#6b7280",
                        }}
                      >
                        {t.purpose}
                      </span>
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
                          onClick={() => deleteTransaction(t.id)}
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
    </div>
  );
}
