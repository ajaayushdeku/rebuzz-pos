"use client";

import { useState, useMemo, createElement } from "react";

import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { Pencil, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPurposeColor,
  Transaction,
  TransactionType,
  useTracker,
} from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";

// Small wrapper to render a purpose icon without creating a component during render
function PurposeIcon({
  icon,
  name,
  size = 13,
  color,
}: {
  icon: string;
  name: string;
  size?: number;
  color?: string;
}) {
  const Icon = getPurposeIcon(icon, name);
  return createElement(Icon, {
    size,
    style: color ? { color } : undefined,
  });
}

function TransactionModal({
  purposeId,
  purposeName,
  purposeIcon,
  type,
  open,
  onClose,
}: {
  purposeId: string;
  purposeName: string;
  purposeIcon: string;
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
          t.kind === type &&
          t.purposeId === purposeId &&
          (t.remark.toLowerCase().includes(search.toLowerCase()) || !search),
      ),
    [transactions, type, purposeId, search],
  );

  const startEdit = (t: Transaction) => {
    setEditingId(t._id);
    setEditRemarks(t.remark);
    setEditAmount(String(t.amount));
  };

  const saveEdit = (id: string) => {
    updateTransaction(id, {
      remark: editRemarks,
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
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor:
                  getPurposeColor(purposeIcon, purposeName) + "20",
              }}
            >
              <PurposeIcon
                icon={purposeIcon}
                name={purposeName}
                color={getPurposeColor(purposeIcon, purposeName)}
              />
            </span>
            {purposeName} — {type}
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
                key={t._id}
                className="border border-gray-100 rounded-lg px-3 py-2.5"
              >
                {editingId === t._id ? (
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
                        onClick={() => saveEdit(t._id)}
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
                        {t.remark || "—"}
                      </p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          type === "expense" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrencySymbol(
                          t.amount,
                          currency.symbol,
                          currency.locale,
                        )}
                      </span>
                      <button
                        onClick={() => startEdit(t)}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t._id)}
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
  const { transactions, allPurposes } = useTracker();
  const { currency } = useCurrency();
  const [selected, setSelected] = useState<string | null>(null);

  // Build purposeId → { name, icon } lookup
  const purposeLookup = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    for (const p of allPurposes) {
      map[p._id] = { name: p.name, icon: p.icon };
    }
    return map;
  }, [allPurposes]);

  const getPurposeName = (purposeId: string) =>
    purposeLookup[purposeId]?.name ?? purposeId;
  const getPurposeIconStr = (purposeId: string) =>
    purposeLookup[purposeId]?.icon ?? "public";

  const grouped = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    transactions
      .filter((t) => t.kind === type)
      .forEach((t) => {
        if (!map[t.purposeId]) map[t.purposeId] = { count: 0, total: 0 };
        map[t.purposeId].count++;
        map[t.purposeId].total += t.amount;
      });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [transactions, type]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 capitalize">
        {type} by Purpose
      </h3>

      <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-sm min-w-[380px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium">Purpose</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Transactions
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No {type}s yet
                </td>
              </tr>
            ) : (
              grouped.map(([purposeId, { count, total }]) => {
                const purposeName = getPurposeName(purposeId);
                return (
                  <tr
                    key={purposeId}
                    onClick={() => setSelected(purposeId)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor:
                              getPurposeColor(
                                getPurposeIconStr(purposeId),
                                purposeName,
                              ) + "20",
                          }}
                        >
                          <PurposeIcon
                            icon={getPurposeIconStr(purposeId)}
                            name={purposeName}
                            color={getPurposeColor(
                              getPurposeIconStr(purposeId),
                              purposeName,
                            )}
                          />
                        </span>
                        <span className="text-xs font-medium text-gray-900">
                          {purposeName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-gray-600">
                      {count}
                    </td>
                    <td
                      className={`py-3 px-4 text-right text-xs font-semibold ${
                        type === "expense" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrencySymbol(
                        total,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <TransactionModal
          purposeId={selected}
          purposeName={getPurposeName(selected)}
          purposeIcon={getPurposeIconStr(selected)}
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
