"use client";

import { useState, useMemo } from "react";

import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PURPOSE_COLORS,
  Transaction,
  TransactionType,
  useTracker,
} from "@/providers/ExpenseContext";

function TransactionModal({
  purpose,
  type,
  open,
  onClose,
}: {
  purpose: string;
  type: TransactionType;
  open: boolean;
  onClose: () => void;
}) {
  const { transactions, deleteTransaction, updateTransaction } = useTracker();
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === type &&
          t.purpose === purpose &&
          (t.remarks.toLowerCase().includes(search.toLowerCase()) || !search),
      ),
    [transactions, type, purpose, search],
  );

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditRemarks(t.remarks);
    setEditAmount(String(t.amount));
  };

  const saveEdit = (id: string) => {
    updateTransaction(id, {
      remarks: editRemarks,
      amount: parseFloat(editAmount) || 0,
    });
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: PURPOSE_COLORS[purpose] ?? "#6b7280" }}
            />
            {purpose} — {type}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search remarks..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No transactions found
            </p>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="border border-gray-100 rounded-lg px-3 py-2.5"
              >
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <input
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => saveEdit(t.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 border border-gray-200 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {t.remarks || "—"}
                      </p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          type === "expense" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(t.amount, currency)}
                      </span>
                      <button
                        onClick={() => startEdit(t)}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTable({ type }: { type: TransactionType }) {
  const { transactions } = useTracker();
  const { currency } = useCurrency();
  const [selected, setSelected] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        if (!map[t.purpose]) map[t.purpose] = { count: 0, total: 0 };
        map[t.purpose].count++;
        map[t.purpose].total += t.amount;
      });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [transactions, type]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 capitalize">
        {type} by Purpose
      </h3>
      {grouped.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No {type}s yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium">Purpose</th>
              <th className="text-center pb-2 font-medium">Transactions</th>
              <th className="text-right pb-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([purpose, { count, total }]) => (
              <tr
                key={purpose}
                onClick={() => setSelected(purpose)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: PURPOSE_COLORS[purpose] ?? "#6b7280",
                      }}
                    />
                    <span className="text-gray-700 font-medium">{purpose}</span>
                  </div>
                </td>
                <td className="py-2.5 text-center text-gray-500">{count}</td>
                <td
                  className={`py-2.5 text-right font-semibold ${
                    type === "expense" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(total, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <TransactionModal
          purpose={selected}
          type={type}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default function PurposeSummaryTables() {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <SummaryTable type="expense" />
      <SummaryTable type="income" />
    </div>
  );
}
