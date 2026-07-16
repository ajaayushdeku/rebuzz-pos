"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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

/**
 * Modal shell styled after SendInvoiceModal: rounded card, sticky bordered
 * header with a title/subtitle and a round close button, scrollable body and
 * a bordered footer for actions.
 */
export default function SettingsModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClass = "sm:max-w-md",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={`${widthClass} px-2 py-2 gap-0 rounded-2xl border-0 shadow-2xl overflow-hidden`}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-3.5">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold text-gray-800">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              {description}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute right-0 top-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* ── Content ── */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3.5">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
