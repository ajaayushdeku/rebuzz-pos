"use client";

import { Trash2, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { Product } from "@/lib/types/product";

interface DeleteProductModalProps {
  product: Product | null;
  onClose: () => void;
  deleting: boolean;
  onConfirm: () => void;
}

export default function DeleteProductModal({
  product,
  onClose,
  deleting,
  onConfirm,
}: DeleteProductModalProps) {
  const variantCount = product?.variants?.length ?? 0;

  return (
    <ModalShell
      open={!!product}
      onClose={onClose}
      busy={deleting}
      title="Delete Product?"
      icon={Trash2}
      iconColor="text-red-600"
      iconBgColor="bg-red-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{product?.name}</span>?
        </p>
        {variantCount > 0 && (
          <p className="text-xs text-gray-500">
            Its {variantCount} variant{variantCount > 1 ? "s" : ""} will be
            removed too.
          </p>
        )}
        <p className="text-xs text-red-600 w-[400px]  bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          disabled={deleting}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {deleting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Trash2 className="h-4 w-4" />
              Delete
            </span>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
