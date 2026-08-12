"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, QrCode, X, Loader2, HandCoins } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import {
  fetchLoyaltyPointSettings,
  LoyaltyPointSettings,
} from "@/services/apiLoyaltyPoint";
import { useInvoiceTicket } from "./useInvoiceTicket";
import { formatCurrencySymbol } from "@/utils/helper";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
  /** Called after a successful payment (e.g. to refresh a list). */
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "qr", label: "QR", icon: QrCode },
] as const;

/** One line of the amount breakdown. Keeps every row on the same grid. */
function SummaryRow({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "credit" | "debit";
}) {
  const toneClass =
    tone === "credit"
      ? "text-emerald-600"
      : tone === "debit"
        ? "text-gray-700"
        : "text-gray-500";

  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}

/** Small uppercase section heading used across the modal. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400">
      {children}
    </span>
  );
}

export default function RecordPaymentModal({
  open,
  onClose,
  invoiceNo,
  onSuccess,
}: RecordPaymentModalProps) {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();

  const { invoice, customerProfile } = useInvoiceTicket(invoiceNo, open);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [loyaltySettings, setLoyaltySettings] =
    useState<LoyaltyPointSettings | null>(null);
  const [redeemEnabled, setRedeemEnabled] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [redeemError, setRedeemError] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [discountError, setDiscountError] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    discount: 0,
    method: "cash",
  });

  // Escape closes the modal; lock background scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset form & load loyalty settings whenever the modal opens for an invoice.
  useEffect(() => {
    if (!open) return;
    setPaymentData({
      amount: invoice?.grandTotal || 0,
      discount: invoice?.discount ?? 0,
      method: "cash",
    });
    setRedeemEnabled(false);
    setRedeemPoints(0);
    setRedeemError("");
    setDiscountType("fixed");
    setDiscountError("");

    (async () => {
      try {
        const response = await fetchLoyaltyPointSettings();
        const data = response && "data" in response ? response.data : response;
        setLoyaltySettings(data as LoyaltyPointSettings);
      } catch {
        console.error("Failed to fetch loyalty settings");
      }
    })();
  }, [open, invoice?.grandTotal, invoice?.discount]);

  // ── Derived calculations ──────────────────────────────────────────────────
  const subtotalBeforeTax = invoice?.total ?? 0;

  type ProductForTax = {
    taxApplied?: boolean;
    taxAmount?: number;
    quantity?: number;
  };
  type ItemGroupForTax = { item?: ProductForTax[] };

  const taxAmount =
    invoice?.items?.reduce((groupSum: number, group: ItemGroupForTax) => {
      const groupTax =
        group.item?.reduce((sum: number, product: ProductForTax) => {
          return (
            sum +
            (product.taxApplied
              ? (product.taxAmount ?? 0) * (product.quantity ?? 0)
              : 0)
          );
        }, 0) ?? 0;
      return groupSum + groupTax;
    }, 0) ?? 0;

  const isTaxApplied = taxAmount > 0;

  const computedDiscountAmount = (() => {
    if (discountType === "percentage") {
      const pct = Math.min(100, Math.max(0, paymentData.discount));
      return (subtotalBeforeTax * pct) / 100;
    }
    return paymentData.discount;
  })();

  const canRedeem =
    !customerProfile ||
    !loyaltySettings ||
    (customerProfile.loyaltyPoint ?? 0) >= loyaltySettings.basePoint;

  const maxRedeemablePoints = loyaltySettings
    ? Math.min(
        customerProfile?.loyaltyPoint ?? 0,
        (subtotalBeforeTax * loyaltySettings.redeemLimit) / 100,
      )
    : 0;

  const finalPayable = Math.max(
    0,
    subtotalBeforeTax +
      taxAmount -
      computedDiscountAmount -
      (redeemEnabled ? redeemPoints : 0),
  );

  const money = (n: number) =>
    formatCurrencySymbol(n, currency.symbol, currency.locale);

  const handleDiscountChange = (value: number) => {
    setPaymentData((prev) => ({ ...prev, discount: value }));
    if (discountType === "percentage" && (value < 0 || value > 100)) {
      setDiscountError("Percentage must be between 0 and 100.");
    } else if (discountType === "fixed" && value > subtotalBeforeTax) {
      setDiscountError("Discount cannot exceed subtotal.");
    } else {
      setDiscountError("");
    }
  };

  const handleRedeemChange = (value: number) => {
    setRedeemPoints(value);
    if (value > (customerProfile?.loyaltyPoint ?? 0)) {
      setRedeemError("Exceeds your available loyalty points.");
    } else if (value > maxRedeemablePoints) {
      setRedeemError(
        `Max redeemable is ${maxRedeemablePoints.toFixed(0)} points.`,
      );
    } else if (value < 0) {
      setRedeemError("Points cannot be negative.");
    } else {
      setRedeemError("");
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || discountError || redeemError || isRecordingPayment) return;
    setIsRecordingPayment(true);

    const formattedDate = new Date()
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

    const paymentPayload = {
      payment: Number(finalPayable.toFixed(2)),
      method: paymentData.method,
      discount: Number(computedDiscountAmount.toFixed(2)),
      paidAt: formattedDate,
      tax: "",
      taxId: null,
      taxamt: taxAmount,
      grandTotal: Number(finalPayable.toFixed(2)),
      redeemPointDeducted: redeemEnabled ? redeemPoints : 0,
      customerEmail: invoice.customerEmail ?? "",
      phoneNumber: invoice.phoneNumber ?? "",
      items: (invoice.items ?? []).map(
        (group: {
          item?: {
            id?: string;
            name?: string;
            quantity?: number;
            unitPrice?: number;
            isTaxable?: boolean;
          }[];
        }) => ({
          id: group.item?.[0]?.id ?? "",
          name: group.item?.[0]?.name ?? "",
          quantity: group.item?.[0]?.quantity ?? 1,
          unitPrice: group.item?.[0]?.unitPrice ?? 0,
          isTaxable: group.item?.[0]?.isTaxable ?? false,
        }),
      ),
    };

    const ticketId = invoice.invoice;

    if (!ticketId || isNaN(Number(ticketId))) {
      toast.error("Invalid Invoice Number");
      setIsRecordingPayment(false);
      return;
    }

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", String(ticketId)] });
      queryClient.invalidateQueries({ queryKey: ["bill-detail", ticketId] });
      onSuccess?.();
    };

    try {
      const paymentRes = await fetch(`/api/tickets/${ticketId}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const paymentResult = await paymentRes.json();

      if (paymentResult.status !== "success") {
        const errorMsg = paymentResult.data?.invoice_number || "Payment failed";
        toast.error(errorMsg);
        return;
      }

      if (redeemEnabled && redeemPoints > 0) {
        const redeemPayload = {
          invoiceNumber: String(ticketId),
          customerEmail: invoice.customerEmail ?? "",
          phoneNumber: invoice.phoneNumber ?? "",
          grandTotal: Number(finalPayable.toFixed(2)),
          redeemPoint: redeemPoints,
        };

        const redeemRes = await fetch("/api/tickets/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(redeemPayload),
        });
        const redeemResult = await redeemRes.json();

        if (redeemResult?.response?.status !== "success") {
          toast.error(
            "Payment recorded but failed to redeem loyalty points. Please contact support.",
          );
          console.error("Redeem failed:", redeemResult);
          refresh();
          onClose();
          return;
        }

        const redeemedAmount =
          redeemResult?.response?.data?.redeemedAmount ?? redeemPoints;
        toast.success(
          `Payment recorded! ${redeemedAmount} loyalty points redeemed.`,
        );
      } else {
        toast.success("Payment Recorded!");
      }

      refresh();
      onClose();
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  if (!open || !mounted) return null;

  const disabled =
    !invoice || !!discountError || !!redeemError || isRecordingPayment;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 "
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Record payment"
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
                {" "}
                {invoice?.invoice != null && (
                  <p className="tabular-nums">Invoice #{invoice.invoice}</p>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!invoice ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-gray-400">
              <Loader2 size={15} className="animate-spin" />
              Loading invoice
            </div>
          ) : (
            <div className="space-y-6">
              {/* Amount due + breakdown */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-4">
                <SectionLabel>Amount due</SectionLabel>
                <p className="mt-1.5 text-[30px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
                  {money(finalPayable)}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-gray-200/70 pt-3">
                  <SummaryRow
                    label="Subtotal"
                    value={money(subtotalBeforeTax)}
                    tone="debit"
                  />
                  {isTaxApplied && (
                    <SummaryRow
                      label="Tax"
                      value={`+ ${money(taxAmount)}`}
                      tone="debit"
                    />
                  )}
                  {computedDiscountAmount > 0 && (
                    <SummaryRow
                      label={
                        discountType === "percentage"
                          ? `Discount (${paymentData.discount}%)`
                          : "Discount"
                      }
                      value={`− ${money(computedDiscountAmount)}`}
                      tone="credit"
                    />
                  )}
                  {redeemEnabled && redeemPoints > 0 && !redeemError && (
                    <SummaryRow
                      label={`Loyalty (${redeemPoints} pts)`}
                      value={`− ${money(redeemPoints)}`}
                      tone="credit"
                    />
                  )}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <SectionLabel>Payment method</SectionLabel>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
                    const active = paymentData.method === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setPaymentData((prev) => ({ ...prev, method: value }))
                        }
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

              {/* Discount */}
              <div>
                <div className="flex items-center justify-between">
                  <SectionLabel>Discount</SectionLabel>
                  <div className="flex rounded-lg border border-gray-200 p-0.5">
                    {(
                      [
                        { key: "fixed", label: currency.symbol },
                        { key: "percentage", label: "%" },
                      ] as const
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setDiscountType(key);
                          setPaymentData((prev) => ({ ...prev, discount: 0 }));
                          setDiscountError("");
                        }}
                        aria-pressed={discountType === key}
                        className={`min-w-[34px] rounded-md px-2 py-1 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          discountType === key
                            ? "bg-gray-900 text-white"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative mt-2">
                  <input
                    type="number"
                    min={0}
                    max={
                      discountType === "percentage" ? 100 : subtotalBeforeTax
                    }
                    value={paymentData.discount}
                    onChange={(e) =>
                      handleDiscountChange(Number(e.target.value))
                    }
                    placeholder={
                      discountType === "percentage" ? "e.g. 10" : "e.g. 50"
                    }
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-[13px] tabular-nums outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                      discountError
                        ? "border-red-300 focus:border-red-400"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                    {discountType === "percentage" ? "%" : currency.symbol}
                  </span>
                </div>

                {discountError ? (
                  <p className="mt-1.5 text-[11px] text-red-500">
                    {discountError}
                  </p>
                ) : (
                  discountType === "percentage" &&
                  paymentData.discount > 0 && (
                    <p className="mt-1.5 text-[11px] text-gray-400 tabular-nums">
                      {paymentData.discount}% of {money(subtotalBeforeTax)} ={" "}
                      {money(computedDiscountAmount)} off
                    </p>
                  )
                )}
              </div>

              {/* Loyalty */}
              {customerProfile && (
                <div className="rounded-xl border border-gray-200 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900">
                        Redeem loyalty points
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 tabular-nums">
                        {(customerProfile.loyaltyPoint ?? 0).toFixed(2)} pts
                        available
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem}
                      aria-label="Redeem loyalty points"
                      aria-pressed={redeemEnabled}
                      onClick={() => {
                        setRedeemEnabled((prev) => !prev);
                        setRedeemPoints(0);
                        setRedeemError("");
                      }}
                      className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 ${
                        !canRedeem
                          ? "cursor-not-allowed bg-gray-200"
                          : redeemEnabled
                            ? "bg-blue-400"
                            : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          redeemEnabled
                            ? "translate-x-[18px]"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {!canRedeem && loyaltySettings && (
                    <p className="mt-2.5 border-t border-gray-100 pt-2.5 text-[11px] leading-relaxed text-gray-500">
                      Needs at least{" "}
                      <span className="font-semibold text-gray-700 tabular-nums">
                        {loyaltySettings.basePoint} pts
                      </span>{" "}
                      to redeem.
                    </p>
                  )}

                  {redeemEnabled && (
                    <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-gray-400">
                          Points to redeem
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleRedeemChange(
                              Number(maxRedeemablePoints.toFixed(0)),
                            )
                          }
                          className="text-[11px] font-semibold text-blue-400 transition hover:text-blue-700 tabular-nums"
                        >
                          Use max ({maxRedeemablePoints.toFixed(0)} points)
                        </button>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={maxRedeemablePoints}
                        value={redeemPoints}
                        onChange={(e) =>
                          handleRedeemChange(Number(e.target.value))
                        }
                        placeholder="0"
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] tabular-nums outline-none transition focus:ring-2 focus:ring-blue-400/40 ${
                          redeemError
                            ? "border-red-300 focus:border-red-400"
                            : "border-gray-200 focus:border-blue-400"
                        }`}
                      />
                      {redeemError ? (
                        <p className="text-[11px] text-red-500">
                          {redeemError}
                        </p>
                      ) : (
                        redeemPoints > 0 && (
                          <p className="text-[11px] text-gray-400 tabular-nums">
                            {redeemPoints} pts = {money(redeemPoints)} off
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleRecordPayment}
            disabled={disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {isRecordingPayment ? (
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
                Confirm &amp; Pay
                <span className="tabular-nums">{money(finalPayable)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
