"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /**
   * Badge icon, same contract as ModalShell's. Defaults to a warning triangle.
   * Callers pass the icon of the thing being deleted; the red tint is what
   * carries the "destructive" reading, so keep the colours red unless there's
   * a reason not to.
   */
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  /**
   * Optional red callout below the description, for the one consequence the
   * user most needs to see — "This action cannot be undone", "This moves it to
   * the archived list".
   */
  warning?: string;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * The delete preset of {@link ConfirmDialog} — red tone, Delete / Deleting
 * labels, a trash icon on the confirm button.
 *
 * Kept as its own component because a dozen call sites already speak this API;
 * all the layout lives in ConfirmDialog, which refunds and move-to-credit share.
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon = AlertTriangle,
  iconColor = "text-red-500",
  iconBgColor = "bg-red-50",
  warning,
  onConfirm,
  isPending = false,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={() => onOpenChange(false)}
      icon={icon}
      iconColor={iconColor}
      iconBgColor={iconBgColor}
      title={title}
      description={description}
      warning={warning}
      tone="danger"
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      confirmIcon={Trash2}
      onConfirm={onConfirm}
      isPending={isPending}
    />
  );
}
