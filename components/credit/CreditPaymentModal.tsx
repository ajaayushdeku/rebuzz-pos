"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  HandCoins,
  X,
  Banknote,
  CreditCard,
  QrCode,
  Smartphone,
} from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { Credit } from "@/services/apiCredit.client";
import { useLockAppScroll } from "@/hooks/useLockAppScroll";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  // { value: "card", label: "Card", icon: CreditCard },
  { value: "Qr Payment", label: "QR", icon: QrCode },
  // { value: "online", label: "Online", icon: Smartphone },
] as const;

/** Local "YYYY-MM-DD HH:mm:ss.SSS" — the format the credit API expects. */
function formatNow(): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

/** Small uppercase section heading, shared with the invoice payment modal. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400">
      {children}
    </span>
  );
}

export default function CreditPaymentModal({
  open,
  onClose,
  credit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  /** `fullyPaid` is true when this payment cleared the remaining due. */
  onSuccess?: (fullyPaid: boolean) => void;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);

  // Reset the form whenever a new credit is opened.
  useEffect(() => {
    if (open && credit) {
      setAmount(String(credit.dueAmount ?? 0));
      setMethod("cash");
    }
  }, [open, credit]);

  // Escape closes the modal; lock background scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  useLockAppScroll(open);

  if (!open || !mounted || !credit) return null;

  const due = credit.dueAmount ?? 0;
  const value = Number(amount);
  const hasValue = amount.trim() !== "" && Number.isFinite(value) && value > 0;
  const isOverDue = hasValue && value > due;
  const isValidValue = hasValue && !isOverDue;
  const remaining = Math.max(0, due - (hasValue ? value : 0));

  /** Drives both the input border and the message under it. */
  const state: "none" | "full" | "partial" | "over" = !hasValue
    ? "none"
    : isOverDue
      ? "over"
      : value >= due
        ? "full"
        : "partial";

  const message =
    state === "over"
      ? `Amount cannot exceed the due of ${fmt(due)}`
      : state === "full"
        ? "This clears the full due"
        : state === "partial"
          ? `${fmt(remaining)} stays due after this payment`
          : "";

  const messageClass =
    state === "over"
      ? "text-red-500"
      : state === "full"
        ? "text-emerald-600"
        : "text-amber-600";

  const inputClass =
    state === "over"
      ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
      : state === "full"
        ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/20"
        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20";

  const handleSubmit = async () => {
    if (!isValidValue) {
      toast.error(
        isOverDue
          ? `Amount cannot exceed the due of ${fmt(due)}`
          : "Enter a valid payment amount",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/credit/${credit._id}/add-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentAmount: String(value),
          paidAt: formatNow(),
          paymentMethod: method,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === "error") {
        throw new Error(
          data?.data?.message || data?.message || "Failed to record payment",
        );
      }
      toast.success("Payment recorded");
      onSuccess?.(value >= due);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record payment",
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 "
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Record credit payment"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <HandCoins size={16} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold leading-tight text-gray-900">
                Record payment
              </h2>

              <p className="mt-0.5 truncate text-[12px] text-gray-400 flex flex-row items-center ">
                {credit.user?.name || "Customer"} ·
                {credit?.invoiceNo && (
                  <p className="pl-1 tabular-nums">
                    {" "}
                    Invoice #{credit.invoiceNo}
                  </p>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="space-y-6 px-6 py-5">
          {/* Outstanding due + live remainder */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-4">
            <SectionLabel>Outstanding due</SectionLabel>
            <p className="mt-1.5 text-[30px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
              {fmt(due)}
            </p>

            {hasValue && !isOverDue && (
              <div className="mt-4 space-y-1.5 border-t border-gray-200/70 pt-3">
                <div className="flex items-baseline justify-between gap-4 text-[13px]">
                  <span className="text-gray-500">Paying now</span>
                  <span className="font-medium text-gray-700 tabular-nums">
                    − {fmt(value)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-[13px]">
                  <span className="text-gray-500">Remaining after</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      remaining === 0 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {fmt(remaining)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Amount</SectionLabel>
              <button
                type="button"
                onClick={() => setAmount(String(due))}
                className="text-[11px] font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                Pay full due
              </button>
            </div>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                {currency.symbol}
              </span>
              <input
                type="number"
                min={0}
                max={due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`h-11 w-full rounded-xl border bg-white pl-9 pr-3.5 text-[13px] tabular-nums outline-none transition focus:ring-2 ${inputClass}`}
              />
            </div>

            {message && (
              <p className={`mt-1.5 text-[11px] font-medium ${messageClass}`}>
                {message}
              </p>
            )}
          </div>

          {/* Method */}
          <div>
            <SectionLabel>Payment method</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value: m, label, icon: Icon }) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      className={active ? "text-blue-600" : "text-gray-400"}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-5 py-3 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isValidValue}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Recording Payment...
              </>
            ) : (
              <>
                Record Payment
                {isValidValue && (
                  <span className="tabular-nums">{fmt(value)}</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
