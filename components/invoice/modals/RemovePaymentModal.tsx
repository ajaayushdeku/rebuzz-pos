"use client";

import { Trash2, Loader2 } from "lucide-react";
import { formatCurrencySymbol } from "@/utils/helper";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import ModalShell from "@/components/ui/ModalShell";

export interface PaymentToRemove {
  _id: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentDate?: string;
}

interface RemovePaymentModalProps {
  payment: PaymentToRemove | null;
  onClose: () => void;
  currency: CurrencyConfig;
  deletingPaymentId: string | null;
  onConfirm: (paymentId: string) => void;
}

export default function RemovePaymentModal({
  payment,
  onClose,
  currency,
  deletingPaymentId,
  onConfirm,
}: RemovePaymentModalProps) {
  return (
    <ModalShell
      open={!!payment}
      onClose={onClose}
      busy={deletingPaymentId === payment?._id}
      title="Remove Payment?"
      icon={Trash2}
      iconColor="text-red-600"
      iconBgColor="bg-red-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-600">
          Are you sure you want to remove this payment of{" "}
          <span className="font-semibold text-gray-900">
            {payment?.paymentAmount != null
              ? formatCurrencySymbol(
                  payment.paymentAmount,
                  currency.symbol,
                  currency.locale,
                )
              : ""}
          </span>
          ?
        </p>
        <p className="text-xs text-red-600 w-[400px] bg-red-50 border border-red-100 rounded-lg px-5 py-2 mt-2">
          This action cannot be undone. The payment will be permanently removed
          from the invoice.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          disabled={deletingPaymentId === payment?._id}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={() => payment && onConfirm(payment._id)}
          disabled={deletingPaymentId === payment?._id}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {deletingPaymentId === payment?._id ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Removing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Trash2 className="h-4 w-4" />
              Remove Payment
            </span>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
