"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Loader2, HandCoins } from "lucide-react";

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
  onSuccess?: () => void;
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

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
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
      onSuccess?.();
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HandCoins size={16} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Record Payment</h2>
            <p className="text-[11px] text-gray-400">
              {credit.user?.name ?? "Customer"} · Due {fmt(due)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Payment amount
            </label>
            <input
              type="number"
              min={0}
              max={due}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Payment method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 capitalize"
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
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Record Payment"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
