"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";

/**
 * Accent for the whole dialog. The tone drives the confirm button and the
 * warning callout together so they can't disagree — a red button over an amber
 * warning reads as two different levels of severity.
 */
export type ConfirmTone = "danger" | "warning" | "notice" | "primary";

const TONE: Record<ConfirmTone, { button: string; warning: string }> = {
  danger: {
    button: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    warning: "border-red-100 bg-red-50 text-red-600",
  },
  warning: {
    button: "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400",
    warning: "border-orange-100 bg-orange-50 text-orange-600",
  },
  notice: {
    button: "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500",
    warning: "border-violet-100 bg-violet-50 text-violet-600",
  },
  primary: {
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    warning: "border-blue-100 bg-blue-50 text-blue-600",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Badge icon, same contract as ModalShell's. */
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  /**
   * Replaces the icon badge entirely — for prompts whose subject is better
   * shown than symbolised (a country flag, a product thumbnail). `icon` still
   * supplies the confirm button's icon when `confirmIcon` is omitted.
   */
  badge?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  /** Optional second line — an amount, an invoice name, a count. */
  detail?: React.ReactNode;
  /** Red/amber/violet callout for the consequence the user must not miss. */
  warning?: string;
  confirmLabel: string;
  /** Shown with a spinner while `isPending`. */
  pendingLabel: string;
  /** Icon on the confirm button. Defaults to the badge icon. */
  confirmIcon?: LucideIcon;
  tone?: ConfirmTone;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * The one confirmation dialog: centred badge, title, description, optional
 * warning, and a Cancel / confirm pair. Deletes, refunds and move-to-credit all
 * render through this so a destructive prompt looks the same wherever it fires.
 *
 * Built on ModalShell — the portal, backdrop, Escape handling and scroll lock
 * are the same ones every other modal in the app uses.
 */
export function ConfirmDialog({
  open,
  onClose,
  icon: Icon = AlertTriangle,
  iconColor = "text-red-500",
  iconBgColor = "bg-red-50",
  badge,
  title,
  description,
  detail,
  warning,
  confirmLabel,
  pendingLabel,
  confirmIcon,
  tone = "danger",
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  const ConfirmIcon = confirmIcon ?? Icon;
  const toneStyle = TONE[tone];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={isPending}
      hideHeader
      // Not rendered while hideHeader is set, but ModalShell still uses it as
      // the dialog's aria-label.
      title={title}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${toneStyle.button}`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              <>
                <ConfirmIcon className="h-4 w-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center px-1 pt-2 text-center">
        {badge ?? (
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        )}

        <h2 className="text-base font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-600">{description}</p>

        {detail && (
          <p className="mt-1 text-xs text-gray-500 tabular-nums">{detail}</p>
        )}

        {warning && (
          <p
            className={`mt-3 rounded-lg border px-15 py-3 text-xs ${toneStyle.warning}`}
          >
            {warning}
          </p>
        )}
      </div>
    </ModalShell>
  );
}

export default ConfirmDialog;
