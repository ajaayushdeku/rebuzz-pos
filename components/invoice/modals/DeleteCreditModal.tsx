"use client";

import { Archive } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Credit } from "@/services/apiCredit.client";

interface DeleteCreditModalProps {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  isArchiving: boolean;
  onConfirm: () => void;
}

/**
 * Thin wrapper over the shared {@link DeleteConfirmDialog} — the prop shape is
 * unchanged, only the chrome now comes from the one delete dialog.
 */
export default function DeleteCreditModal({
  open,
  onClose,
  credit,
  isArchiving,
  onConfirm,
}: DeleteCreditModalProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isArchiving) onClose();
      }}
      icon={Archive}
      title="Delete credit?"
      description={
        // CreditsTable's own modal named the customer here, so keep that —
        // it's the only thing distinguishing one credit row from another.
        credit?.user?.name
          ? `The credit for “${credit.user.name}” will be removed from the active list.`
          : "This credited invoice will be removed from the active list."
      }
      warning="This moves it to the archived list."
      onConfirm={onConfirm}
      isPending={isArchiving}
    />
  );
}
