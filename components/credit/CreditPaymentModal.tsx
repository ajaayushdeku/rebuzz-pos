"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Loader2, HandCoins, X } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { Credit } from "@/services/apiCredit.client";

const PAYMENT_METHODS = ["cash", "card", "qr", "online"];

/** Local "YYYY-MM-DD HH:mm:ss.SSS" — the format the credit API expects. */
function formatNow(): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
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

  if (!open || !mounted || !credit) return null;

  const due = credit.dueAmount ?? 0;
  const value = Number(amount);
  const isValidValue = Number.isFinite(value) && value > 0;
  const remaining = due - (Number.isFinite(value) ? value : 0);

  // Info message under the amount, mirroring the invoice payment dialog.
  let infoMessage = "";
  let infoClass = "text-gray-400";
  if (isValidValue) {
    if (value >= due) {
      infoMessage = "Invoice will be fully paid";
      infoClass = "text-green-600";
    } else {
      infoMessage = `${fmt(remaining)} will remain due after this payment`;
      infoClass = "text-amber-600";
    }
  }

  const handleSubmit = async () => {
    if (!isValidValue) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (value > due) {
      toast.error(`Amount cannot exceed the due of ${fmt(due)}`);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <HandCoins size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Record a payment for this invoice
              </h2>
              <p className="text-[11px] text-gray-400">
                {credit.user?.name || "Customer"} · Due {fmt(due)}
              </p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Amount */}
          <div className="flex items-start gap-4">
            <label className="w-24 shrink-0 text-right text-sm font-semibold text-gray-700 pt-2.5">
              Amount
            </label>
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  min={0}
                  max={due}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full h-11 rounded-lg border pl-9 pr-3 text-sm outline-none transition ${
                    infoClass === "text-green-600"
                      ? "border-green-400 focus:ring-2 focus:ring-green-500/20"
                      : "border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
              </div>
              {infoMessage && (
                <p className={`text-xs mt-1.5 font-medium ${infoClass}`}>
                  {infoMessage}
                </p>
              )}
            </div>
          </div>

          {/* Method */}
          <div className="flex items-center gap-4">
            <label className="w-24 shrink-0 text-right text-sm font-semibold text-gray-700">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="flex-1 h-11 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 capitalize"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-gray-300 text-blue-600 hover:bg-gray-50 px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isValidValue}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
