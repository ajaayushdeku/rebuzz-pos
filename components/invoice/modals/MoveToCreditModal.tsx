"use client";

import { Wallet } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface MoveToCreditModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: number | undefined;
  movingToCredit: boolean;
  onConfirm: () => void;
}

/**
 * Renders through the shared {@link ConfirmDialog} so it matches the delete
 * prompts. `notice` tone rather than `danger` — moving an invoice to credit is
 * reversible, and a red button would overstate it.
 */
export default function MoveToCreditModal({
  open,
  onClose,
  invoiceNo,
  movingToCredit,
  onConfirm,
}: MoveToCreditModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      icon={Wallet}
      iconColor="text-violet-600"
      iconBgColor="bg-violet-50"
      title="Move to credit?"
      description={
        invoiceNo != null
          ? `“ORD-${invoiceNo}” will be moved to the credit section.`
          : "This invoice will be moved to the credit section."
      }
      warning="It will be removed from the invoice list."
      tone="notice"
      confirmLabel="Move to credit"
      pendingLabel="Moving..."
      onConfirm={onConfirm}
      isPending={movingToCredit}
    />
  );
}
