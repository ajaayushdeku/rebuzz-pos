"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Small uppercase section heading used across every modal. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400">
      {children}
    </span>
  );
}

/**
 * Renders children into <body>, parked off-screen. Used for the invoice
 * previews that jsPDF rasterises — they must be painted but never seen.
 */
export function OffscreenLayer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none absolute -left-[99999px] top-0 print:hidden"
    >
      {children}
    </div>,
    document.body,
  );
}

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Blocks backdrop / Escape / close-button dismissal while work is running. */
  busy?: boolean;
  /** Tailwind max-width. Default fits a single column of rows. */
  maxWidth?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The one modal chrome: portal, backdrop, Escape, scroll lock, header, footer.
 * Every invoice modal renders its content inside this so spacing, type scale
 * and dismissal behaviour stay identical across the set.
 */
export default function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  busy = false,
  maxWidth = "max-w-xl",
  footer,
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4  print:hidden"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Icon size={16} className="text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-tight text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 truncate text-[12px] text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            aria-label="Close"
            className="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface DocumentRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  /** Present = the row behaves as a radio option. */
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /** Buttons shown on the right for action-style rows. */
  trailing?: React.ReactNode;
}

/**
 * One invoice document (proforma / invoice / tax invoice) as a row.
 * Selectable when `onSelect` is given, otherwise a static row with actions.
 */
export function DocumentRow({
  icon: Icon,
  label,
  description,
  selected = false,
  onSelect,
  disabled = false,
  trailing,
}: DocumentRowProps) {
  const selectable = typeof onSelect === "function";

  const body = (
    <>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
          selected ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        <Icon
          size={16}
          strokeWidth={1.8}
          className={selected ? "text-blue-600" : "text-gray-500"}
        />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-[13px] font-medium leading-tight text-gray-900">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>
      </div>

      {selectable ? (
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
            selected ? "border-blue-600 bg-blue-600" : "border-gray-300"
          }`}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
      ) : (
        trailing
      )}
    </>
  );

  const base =
    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 transition";

  if (selectable) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onSelect}
        className={`${base} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${
          selected
            ? "border-blue-600 bg-blue-50/60"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`${base} border-gray-200 bg-white hover:border-gray-300`}>
      {body}
    </div>
  );
}
