"use client";

import { Wallet, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";

interface MoveToCreditModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: number | undefined;
  movingToCredit: boolean;
  onConfirm: () => void;
}

export default function MoveToCreditModal({
  open,
  onClose,
  invoiceNo,
  movingToCredit,
  onConfirm,
}: MoveToCreditModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={movingToCredit}
      title="Move to Credit?"
      icon={Wallet}
      iconColor="text-violet-600"
      iconBgColor="bg-violet-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-500 w-[450px] px-5">
          Invoice{" "}
          <span className="font-medium text-gray-700">ORD-{invoiceNo}</span>{" "}
          will be moved to the credit section and removed from the invoice list.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          disabled={movingToCredit}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={movingToCredit}
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {movingToCredit ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Moving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Wallet className="h-4 w-4" /> Move to Credit
            </span>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
