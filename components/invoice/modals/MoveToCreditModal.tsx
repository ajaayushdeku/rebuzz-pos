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
      iconColor="text-amber-600"
      iconBgColor="bg-amber-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-500 w-[450px] px-5">
          Invoice{" "}
          <span className="font-medium text-gray-700">ORD-{invoiceNo}</span>{" "}
          will be moved to the credit section and removed from the invoice list.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={movingToCredit}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={movingToCredit}
          className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {movingToCredit ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Moving...
            </span>
          ) : (
            "Move to Credit"
          )}
        </button>
      </div>
    </ModalShell>
  );
}
