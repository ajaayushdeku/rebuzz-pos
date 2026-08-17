"use client";

import { Package } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Product } from "@/lib/types/product";

interface DeleteProductModalProps {
  product: Product | null;
  onClose: () => void;
  deleting: boolean;
  onConfirm: () => void;
}

/**
 * Thin wrapper over the shared {@link DeleteConfirmDialog} — the prop shape is
 * unchanged, only the chrome now comes from the one delete dialog.
 */
export default function DeleteProductModal({
  product,
  onClose,
  deleting,
  onConfirm,
}: DeleteProductModalProps) {
  const variantCount = product?.variants?.length ?? 0;

  // The variant warning was its own line before; folded into the description so
  // the shared dialog keeps a single body paragraph.
  const description = [
    product?.name
      ? `“${product.name}” will be permanently removed.`
      : "This product will be permanently removed.",
    variantCount > 0 &&
      `Its ${variantCount} variant${variantCount > 1 ? "s" : ""} will be removed too.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DeleteConfirmDialog
      open={!!product}
      onOpenChange={(o) => {
        if (!o && !deleting) onClose();
      }}
      icon={Package}
      title="Delete product?"
      description={description}
      warning="This action cannot be undone."
      onConfirm={onConfirm}
      isPending={deleting}
    />
  );
}
