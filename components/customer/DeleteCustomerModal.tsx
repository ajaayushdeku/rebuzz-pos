"use client";

import { User } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Customer } from "./customer-columns";

interface DeleteCustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  deleting: boolean;
  onConfirm: () => void;
}

/**
 * Thin wrapper over the shared {@link DeleteConfirmDialog} — the prop shape is
 * unchanged, only the chrome now comes from the one delete dialog.
 */
export default function DeleteCustomerModal({
  customer,
  onClose,
  deleting,
  onConfirm,
}: DeleteCustomerModalProps) {
  return (
    <DeleteConfirmDialog
      open={!!customer}
      onOpenChange={(o) => {
        if (!o && !deleting) onClose();
      }}
      icon={User}
      title="Delete customer?"
      description={
        customer?.name
          ? `“${customer.name}” will be permanently removed.`
          : "This customer will be permanently removed."
      }
      warning="This action cannot be undone."
      onConfirm={onConfirm}
      isPending={deleting}
    />
  );
}
