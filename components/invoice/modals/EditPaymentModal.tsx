"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, PencilLine, Banknote, QrCode } from "lucide-react";

import ModalShell, { SectionLabel } from "@/components/ui/ModalShell";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { updateCreditPayment } from "@/services/apiCredit.client";
import type { CreditPayment } from "@/services/apiCredit.client";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "qr", label: "QR", icon: QrCode },
] as const;

/**
 * Local "YYYY-MM-DD HH:mm:ss.SSS" — the format the credit edit-payment API
 * expects (matches the add-payment format used elsewhere).
 */
function formatDateTime(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

/** Convert "YYYY-MM-DD HH:mm:ss.SSS" → "YYYY-MM-DDTHH:mm" for datetime-local. */
function toDateTimeLocal(raw: string): string {
  const normalized = raw?.replace(" ", "T");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface EditPaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** The credit this payment belongs to. */
  creditId: string | null;
  /** The payment being edited. */
  payment: CreditPayment | null;
  /** Max amount the edited payment may be (the credit's due + payment). */
  maxAmount: number;
  onSuccess?: () => void;
}

/** Inner component — mounted *after* `payment`/`open` are decided so its
 *  useState initial values always reflect the payment being edited. This
 *  avoids calling setState inside an effect (ESLint react-hooks). */
function EditPaymentForm({
  onClose,
  creditId,
  payment,
  maxAmount,
  onSuccess,
}: EditPaymentModalProps) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const [amount, setAmount] = useState(String(payment?.paymentAmount ?? ""));
  const [method, setMethod] = useState(payment?.paymentMethod || "cash");
  const [paidAt, setPaidAt] = useState(
    toDateTimeLocal(payment?.paymentDate ?? ""),
  );
  const [saving, setSaving] = useState(false);

  const originalAmount = payment?.paymentAmount ?? 0;
  const value = Number(amount);
  const hasValue = amount.trim() !== "" && Number.isFinite(value) && value > 0;
  const isOverMax = hasValue && value > maxAmount;
  const isValid = hasValue && !isOverMax && !!paidAt;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error(
        isOverMax
          ? `Amount cannot exceed ${fmt(maxAmount)}`
          : "Enter a valid amount and date",
      );
      return;
    }

    setSaving(true);
    try {
      await updateCreditPayment(creditId!, payment!._id, {
        paymentAmount: Number(value.toFixed(2)),
        paymentMethod: method,
        paidAt: formatDateTime(new Date(paidAt)),
      });
      toast.success("Payment updated");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update payment",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open
      onClose={onClose}
      busy={saving}
      title="Edit payment"
      subtitle={`Original payment: ${fmt(originalAmount)}`}
      icon={PencilLine}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Amount */}
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Amount</SectionLabel>
            <span className="text-[11px] text-gray-400 tabular-nums">
              Max {fmt(maxAmount)}
            </span>
          </div>

          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
              {currency.symbol}
            </span>
            <input
              type="number"
              min={0}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`h-11 w-full rounded-xl border bg-white pl-9 pr-3.5 text-[13px] tabular-nums outline-none transition focus:ring-2 ${
                isOverMax
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
          </div>

          {isOverMax && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              Amount cannot exceed {fmt(maxAmount)}
            </p>
          )}
        </div>

        {/* Payment method */}
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

        {/* Paid at */}
        <div>
          <SectionLabel>Payment date & time</SectionLabel>
          <input
            type="datetime-local"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] tabular-nums outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4 -mx-6 -mb-5 mt-6">
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
          disabled={saving || !isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating Payment...
            </>
          ) : (
            <>
              Update Payment
              {isValid && <span className="tabular-nums">{fmt(value)}</span>}
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

export default function EditPaymentModal(props: EditPaymentModalProps) {
  const { open, payment, creditId } = props;
  if (!open || !payment || !creditId) return null;

  // Key the inner form by payment._id so it remounts (and re-inits its
  // useState) whenever a different payment is being edited.
  return <EditPaymentForm key={payment._id} {...props} />;
}
