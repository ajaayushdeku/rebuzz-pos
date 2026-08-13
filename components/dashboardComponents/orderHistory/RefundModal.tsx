"use client";

import { RotateCcw, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import type { Transaction } from "./transaction-columns";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

interface RefundModalProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
  isRefunding: boolean;
}

export default function RefundModal({
  open,
  transaction,
  onClose,
  onConfirm,
  isRefunding,
}: RefundModalProps) {
  const { currency } = useCurrency();
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={isRefunding}
      title="Refund Transaction"
      icon={RotateCcw}
      iconColor="text-amber-600"
      iconBgColor="bg-amber-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-600">
          Are you sure you want to refund{" "}
          <span className="font-semibold text-gray-900">{transaction?.id}</span>
          ?
        </p>
        {transaction && (
          <p className="text-xs text-gray-400">
            {transaction.invoiceName || "—"} ·{" "}
            {formatCurrencySymbol(
              Number(transaction.amount),
              currency.symbol,
              currency.locale,
            )}
          </p>
        )}
        <p className="text-xs text-orange-600 w-[400px] bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mt-2">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          disabled={isRefunding}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isRefunding}
          className="rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isRefunding ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              Refunding...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Confirm Refund
            </span>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
