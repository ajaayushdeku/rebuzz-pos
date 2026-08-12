"use client";

import { Trash2, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import type { Credit } from "@/services/apiCredit.client";

interface DeleteCreditModalProps {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  isArchiving: boolean;
  onConfirm: () => void;
}

export default function DeleteCreditModal({
  open,
  onClose,
  credit,
  isArchiving,
  onConfirm,
}: DeleteCreditModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={isArchiving}
      title="Delete Credit?"
      icon={Trash2}
      iconColor="text-red-600"
      iconBgColor="bg-red-100"
      maxWidth="max-w-lg"
    >
      <div className="text-center space-y-1 py-1 flex flex-col items-center">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">
            {credit?.user?.name || "this credit"}
          </span>
          ?
        </p>
        <p className="text-xs text-red-600 bg-red-50  w-[400px] border border-red-100 rounded-lg px-5 py-2 mt-2">
          This moves it to the archived list.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          disabled={isArchiving}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isArchiving}
          className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isArchiving ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </span>
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </ModalShell>
  );
}
