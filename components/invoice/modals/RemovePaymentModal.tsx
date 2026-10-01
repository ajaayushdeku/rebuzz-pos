"use client";

import { Trash2 } from "lucide-react";
import { formatCurrencySymbol } from "@/utils/helper";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateLong } from "@/components/credit/detail/creditDetailHelpers";

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

/**
 * Remove one recorded payment.
 *
 * Rendered through the shared {@link ConfirmDialog} rather than its own markup:
 * it is the same shape as every other destructive prompt in the app — badge,
 * title, description, red callout, Cancel / confirm pair — and building it by
 * hand had left it on a different button size, a slate border where the rest of
 * the app uses gray, and a fixed `w-[400px]` callout that overflowed the dialog
 * on a narrow screen.
 *
 * The method and date now show as the dialog's `detail` line. They were already
 * being passed in and never displayed, which mattered: with several payments
 * against one invoice, the amount alone does not say which one is about to go.
 */
export default function RemovePaymentModal({
  payment,
  onClose,
  currency,
  deletingPaymentId,
  onConfirm,
}: RemovePaymentModalProps) {
  const isPending = deletingPaymentId === payment?._id;

  const amount =
    payment?.paymentAmount != null
      ? formatCurrencySymbol(
          payment.paymentAmount,
          currency.symbol,
          currency.locale,
        )
      : null;

  const detail = [
    payment?.paymentMethod,
    payment?.paymentDate ? formatDateLong(payment.paymentDate) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ConfirmDialog
      open={!!payment}
      onClose={onClose}
      icon={Trash2}
      iconColor="text-red-600 dark:text-red-500"
      iconBgColor="bg-red-100 dark:bg-red-400/15"
      title="Remove payment?"
      description={
        amount ? (
          <>
            This payment of{" "}
            <span className="font-semibold text-gray-900 dark:text-[#e8ecf4]">
              {amount}
            </span>{" "}
            will be removed from the invoice.
          </>
        ) : (
          "This payment will be removed from the invoice."
        )
      }
      detail={detail || undefined}
      warning="This action cannot be undone."
      tone="danger"
      confirmLabel="Remove payment"
      pendingLabel="Removing..."
      confirmIcon={Trash2}
      onConfirm={() => payment && onConfirm(payment._id)}
      isPending={isPending}
    />
  );
}
