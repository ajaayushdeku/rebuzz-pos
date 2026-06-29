"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrency } from "@/providers/CurrencyContext";
import {
  fetchLoyaltyPointSettings,
  LoyaltyPointSettings,
} from "@/services/apiLoyaltyPoint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceTicket } from "./useInvoiceTicket";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNo: string | number | undefined;
  /** Called after a successful payment (e.g. to refresh a list). */
  onSuccess?: () => void;
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg px-2 py-1 rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-3.5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Record Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Process payment for this invoice
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* ── Content ── */}
        <div
          className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {!invoice ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              Loading invoice...
            </div>
          ) : (
            <>
              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                  Payment Method
                </label>
                <Select
                  value={paymentData.method}
                  onValueChange={(value) =>
                    setPaymentData({ ...paymentData, method: value })
                  }
                >
                  <SelectTrigger className="w-full h-10 rounded-xl border-gray-200 bg-white font-medium capitalize text-sm">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                    <SelectItem
                      value="cash"
                      className="py-2.5 cursor-pointer font-medium text-sm"
                    >
                      Cash
                    </SelectItem>
                    <SelectItem
                      value="card"
                      className="py-2.5 cursor-pointer font-medium text-sm"
                    >
                      Credit Card
                    </SelectItem>
                    <SelectItem
                      value="qr"
                      className="py-2.5 cursor-pointer font-medium text-sm"
                    >
                      QR / Digital Wallet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">
                    {currency.symbol} {subtotalBeforeTax.toFixed(2)}
                  </span>
                </div>
                {isTaxApplied && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tax</span>
                    <span>
                      +{currency.symbol} {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {computedDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>
                      −{currency.symbol} {computedDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {redeemEnabled && redeemPoints > 0 && !redeemError && (
                  <div className="flex justify-between text-violet-500">
                    <span>Loyalty redeemed</span>
                    <span>
                      −{currency.symbol} {redeemPoints.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 border-t pt-1.5 mt-1">
                  <span>Total payable</span>
                  <span>
                    {currency.symbol} {finalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                  Discount
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("fixed");
                      setPaymentData((prev) => ({ ...prev, discount: 0 }));
                      setDiscountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      discountType === "fixed"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Fixed Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("percentage");
                      setPaymentData((prev) => ({ ...prev, discount: 0 }));
                      setDiscountError("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      discountType === "percentage"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>
                <div className="relative">
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
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10 ${
                      discountError ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {discountType === "percentage" ? "%" : currency.symbol}
                  </span>
                </div>
                {discountType === "percentage" &&
                  paymentData.discount > 0 &&
                  !discountError && (
                    <p className="text-xs text-gray-400 mt-1">
                      {paymentData.discount}% of {currency.symbol}{" "}
                      {subtotalBeforeTax.toFixed(2)} = {currency.symbol}{" "}
                      {computedDiscountAmount.toFixed(2)} off
                    </p>
                  )}
                {discountError && (
                  <p className="text-xs text-red-500 mt-1">{discountError}</p>
                )}
              </div>

              {/* Loyalty */}
              {customerProfile && (
                <div className="border border-violet-200 rounded-xl p-4 space-y-3 bg-violet-50/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Redeem Loyalty Points
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Customer has{" "}
                        <span className="font-semibold text-violet-600">
                          {(customerProfile.loyaltyPoint ?? 0).toFixed(2)} pts
                        </span>{" "}
                        available
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem}
                      onClick={() => {
                        setRedeemEnabled((prev) => !prev);
                        setRedeemPoints(0);
                        setRedeemError("");
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                        !canRedeem
                          ? "bg-gray-300 cursor-not-allowed"
                          : redeemEnabled
                            ? "bg-violet-500"
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
                    <div className="bg-violet-100/60 rounded-lg px-3 py-2.5 text-xs text-gray-600">
                      Your loyalty point is lower than the required base point (
                      <span className="font-semibold text-violet-700">
                        {loyaltySettings.basePoint} pts
                      </span>
                      ). You currently have{" "}
                      <span className="font-semibold">
                        {(customerProfile.loyaltyPoint ?? 0).toFixed(2)} pts
                      </span>
                      .
                    </div>
                  )}
                  {redeemEnabled && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-violet-200">
                        <div>
                          <p className="text-gray-400">Total points</p>
                          <p className="font-bold text-gray-800 text-sm">
                            {customerProfile.loyaltyPoint ?? 0} pts
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Max redeemable</p>
                          <p className="font-bold text-violet-600 text-sm">
                            {maxRedeemablePoints.toFixed(0)} pts
                          </p>
                        </div>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          max={maxRedeemablePoints}
                          value={redeemPoints}
                          onChange={(e) =>
                            handleRedeemChange(Number(e.target.value))
                          }
                          placeholder={`Max ${maxRedeemablePoints.toFixed(0)} pts`}
                          className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-violet-400 outline-none text-sm ${
                            redeemError ? "border-red-300" : "border-violet-200"
                          }`}
                        />
                        {redeemError && (
                          <p className="text-xs text-red-500 mt-1">
                            {redeemError}
                          </p>
                        )}
                        {!redeemError && redeemPoints > 0 && (
                          <p className="text-xs text-violet-500 mt-1">
                            {redeemPoints} pts = {currency.symbol}{" "}
                            {redeemPoints.toFixed(2)} off
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Final Amount */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-gray-400 text-[11px] uppercase font-medium">
                    Final Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {currency.symbol} {finalPayable.toFixed(2)}
                  </p>
                </div>
                <span className="text-[11px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium capitalize">
                  {paymentData.method}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleRecordPayment}
            disabled={
              !invoice || !!discountError || !!redeemError || isRecordingPayment
            }
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
                Processing Payment...
              </>
            ) : (
              <>
                Confirm &amp; Pay {currency.symbol}
                {finalPayable.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
