"use client";

import { FileText } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

interface DeleteInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: number | undefined;
  isDeleting: boolean;
  onConfirm: () => void;
}

/**
 * Thin wrapper over the shared {@link DeleteConfirmDialog} — the prop shape is
 * unchanged, only the chrome now comes from the one delete dialog.
 */
export default function DeleteInvoiceModal({
  open,
  onClose,
  invoiceNo,
  isDeleting,
  onConfirm,
}: DeleteInvoiceModalProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isDeleting) onClose();
      }}
      icon={FileText}
      title="Delete invoice?"
      description={
        invoiceNo != null
          ? `“ORD-${invoiceNo}” will be permanently removed.`
          : "This invoice will be permanently removed."
      }
      warning="This action cannot be undone."
      onConfirm={onConfirm}
      isPending={isDeleting}
    />
  );
}
