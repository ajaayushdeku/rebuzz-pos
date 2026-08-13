"use client";

import { Loader2, Trash2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";

const DeleteConfirmModal = ({
  open,
  onOpenChange,
  title,
  message,
  itemName,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  isPending?: boolean;
}) => {
  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      title={title}
      subtitle={message}
      icon={Trash2}
      iconColor="text-red-600"
      iconBgColor="bg-red-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete &ldquo;
          <span className="font-semibold">{itemName}</span> &ldquo;?
        </p>
        <p className="text-xs text-red-600 w-[400px] bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-1.5">
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
};

export default DeleteConfirmModal;
