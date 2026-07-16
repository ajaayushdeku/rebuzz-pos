"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import SettingsModalShell, {
  modalCancelBtn,
  modalDangerBtn,
} from "@/components/settingsComponents/SettingsModalShell";

const DeleteConfirmModal = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isPending?: boolean;
}) => {
  return (
    <SettingsModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="This action cannot be undone"
      widthClass="sm:max-w-sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={modalDangerBtn}
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <AlertTriangle size={16} className="text-red-600" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
    </SettingsModalShell>
  );
};

export default DeleteConfirmModal;
