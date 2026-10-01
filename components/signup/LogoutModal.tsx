"use client";

import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  loggingOut: boolean;
  onConfirm: () => void;
}

/**
 * Renders through the shared {@link ConfirmDialog} so it matches the delete
 * prompts. `notice` tone rather than `danger` — moving an invoice to credit is
 * reversible, and a red button would overstate it.
 */
export default function LogoutModal({
  open,
  onClose,
  loggingOut,
  onConfirm,
}: LogoutModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      icon={LogOut}
      iconColor="text-rose-600 dark:text-rose-300"
      iconBgColor="bg-rose-50 dark:bg-rose-400/10"
      title="Logging Out?"
      description={"This will log you out of your account."}
      warning="You will need to sign in again to access your account."
      tone="notice"
      confirmLabel="Logout"
      pendingLabel="Logging out..."
      onConfirm={onConfirm}
      isPending={loggingOut}
    />
  );
}
