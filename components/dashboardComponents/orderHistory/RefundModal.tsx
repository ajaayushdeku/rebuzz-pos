"use client";

import { RotateCcw, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import type { Transaction } from "./transaction-columns";

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
            Customer: {transaction.invoiceName || "—"} · {transaction.amount}
          </p>
        )}
        <p className="text-xs text-orange-600 w-[400px] bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mt-2">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          disabled={isRefunding}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isRefunding}
          className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isRefunding ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              Refunding...
            </span>
          ) : (
            "Confirm Refund"
          )}
        </button>
      </div>
    </ModalShell>
  );
}
