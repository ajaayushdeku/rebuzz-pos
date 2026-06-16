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
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 text-xs text-gray-400 font-medium border-b border-gray-100 pb-2 mb-2">
        <div className="col-span-4">Details</div>
        <div className="col-span-3">Purpose</div>
        <div
          className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-600"
          onClick={() => toggleSort("date")}
        >
          Date <ArrowUpDown size={11} />
        </div>
        <div
          className="col-span-2 flex items-center justify-end gap-1 cursor-pointer hover:text-gray-600"
          onClick={() => toggleSort("amount")}
        >
          Amount <ArrowUpDown size={11} />
        </div>
        <div className="col-span-1" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No transactions found
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((t) => {
            const isExpense = t.type === "expense";
            const Icon = isExpense ? TrendingDown : TrendingUp;
            const color = isExpense ? "text-red-500" : "text-green-500";
            const bg = isExpense ? "bg-red-50" : "bg-green-50";

            return (
              <div
                key={t.id}
                className="grid grid-cols-12 items-center py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-1 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <div
                    className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <Icon size={13} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
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
                <div className="col-span-3">
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
                </div>
                <div className="col-span-2 text-xs text-gray-400">{t.date}</div>
                <div
                  className={`col-span-2 text-right text-xs font-semibold ${color}`}
                >
                  {isExpense ? "− " : "+ "}
                  {formatCurrencySymbol(
                    t.amount,
                    currency.symbol,
                    currency.locale,
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
