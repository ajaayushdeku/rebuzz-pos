"use client";

import { RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

/**
 * Renders through the shared {@link ConfirmDialog} so it matches the delete
 * prompts. `warning` tone — a refund is irreversible but isn't a deletion.
 */
export default function RefundModal({
  open,
  transaction,
  onClose,
  onConfirm,
  isRefunding,
}: RefundModalProps) {
  const { currency } = useCurrency();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      icon={RotateCcw}
      iconColor="text-orange-600"
      iconBgColor="bg-orange-50"
      title="Refund transaction?"
      description={
        transaction?.id
          ? `“${transaction.id}” will be refunded.`
          : "This transaction will be refunded."
      }
      detail={
        transaction
          ? `${transaction.invoiceName || "—"} · ${formatCurrencySymbol(
              Number(transaction.amount),
              currency.symbol,
              currency.locale,
            )}`
          : undefined
      }
      warning="This action cannot be undone."
      tone="warning"
      confirmLabel="Confirm Refund"
      pendingLabel="Refunding..."
      onConfirm={onConfirm}
      isPending={isRefunding}
    />
  );
}
