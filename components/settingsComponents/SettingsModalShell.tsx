"use client";

import type { ReactNode } from "react";
import ModalShell from "@/components/ui/ModalShell";

/** Footer button styles shared by the settings modals (match SendInvoiceModal). */
export const modalCancelBtn =
  "rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const modalPrimaryBtn =
  "rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5";

export const modalDangerBtn =
  "rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5";

/** Shared input style used across the settings modals. */
export const modalInputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

/** Map a Tailwind `sm/md:max-w-*` class to a bare `max-w-*` for ModalShell. */
const toMaxWidth = (widthClass: string): string => {
  const match = widthClass.match(/max-w-(\S+)/);
  return match ? `max-w-${match[1]}` : "max-w-xl";
};

/**
 * Modal shell shared by the settings pages (discounts, taxes, categories).
 * Renders through the same {@link ModalShell} used by the invoice modals so
 * the whole app shares one consistent modal chrome — backdrop, animated card,
 * icon header, Escape/scroll-lock, and footer.
 */
export default function SettingsModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClass = "md:max-w-lg",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Tailwind width class for the sm+ breakpoint. */
  widthClass?: string;
}) {
  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      subtitle={description}
      maxWidth={toMaxWidth(widthClass)}
      footer={footer}
    >
      {children}
    </ModalShell>
  );
}
