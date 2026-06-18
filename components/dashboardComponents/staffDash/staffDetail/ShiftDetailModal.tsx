"use client";

import {
  X,
  Clock,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { ShiftDetail } from "./staffDetailHelpers";
import { parseNepalDateTime, extractTime } from "./staffDetailHelpers";

interface ShiftDetailModalProps {
  open: boolean;
  shiftDetail: ShiftDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function ShiftDetailModal({
  open,
  shiftDetail,
  loading,
  onClose,
}: ShiftDetailModalProps) {
  const { currency } = useCurrency();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Clock size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Shift Details
              </h2>
              <p className="text-[11px] text-gray-400 mt-px">
                {shiftDetail?.transactions?.length ?? 0} transactions recorded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-amber-500" />
              <span className="ml-3 text-sm text-gray-400">
                Loading shift details...
              </span>
            </div>
          ) : shiftDetail ? (
            <ShiftDetailContent shiftDetail={shiftDetail} />
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Clock size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No shift details available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shift Detail Content ── */

function ShiftDetailContent({ shiftDetail }: { shiftDetail: ShiftDetail }) {
  const { currency } = useCurrency();
  return (
    <div>
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <DetailCard
          label="Opening Cash"
          value={formatCurrencySymbol(
            shiftDetail.openingCash,
            currency.symbol,
            currency.locale,
          )}
          accent="text-emerald-600"
        />
        <DetailCard
          label="Closing Cash"
          value={formatCurrencySymbol(
            shiftDetail.closingCash,
            currency.symbol,
            currency.locale,
          )}
          accent="text-blue-600"
        />
        <DetailCard
          label="Opened At"
          value={
            shiftDetail.openingTime
              ? (parseNepalDateTime(shiftDetail.openingTime)?.toLocaleString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                ) ?? extractTime(shiftDetail.openingTime))
              : "—"
          }
          accent="text-gray-800"
        />
        <DetailCard
          label="Closed At"
          value={
            shiftDetail.closingTime
              ? (parseNepalDateTime(shiftDetail.closingTime)?.toLocaleString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                ) ?? extractTime(shiftDetail.closingTime))
              : "—"
          }
          accent="text-gray-800"
        />
      </div>

      {/* Cash difference */}
      {shiftDetail.closingTime && (
        <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div
            className={`w-2 h-2 rounded-full ${
              shiftDetail.closingCash - shiftDetail.openingCash >= 0
                ? "bg-emerald-400"
                : "bg-red-400"
            }`}
          />
          <span className="text-xs text-gray-500">Cash Difference:</span>
          <span
            className={`text-sm font-bold ${
              shiftDetail.closingCash - shiftDetail.openingCash >= 0
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {formatCurrencySymbol(
              shiftDetail.closingCash - shiftDetail.openingCash,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      )}

      {/* Transactions */}
      {shiftDetail.transactions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center">
              <Receipt size={10} className="text-purple-500" />
            </div>
            <h4 className="text-xs font-semibold text-gray-700">
              Shift Transactions
            </h4>
            <span className="text-[10px] text-gray-400 font-medium ml-auto">
              {shiftDetail.transactions.length} entries
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50/80">
                  <th className="text-left py-2.5 px-3 font-semibold">Time</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Type</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Note</th>
                  <th className="text-left py-2.5 px-3 font-semibold">
                    Payment
                  </th>
                  <th className="text-right py-2.5 px-3 font-semibold">
                    Amount
                  </th>
                  <th className="text-center py-2.5 px-3 font-semibold">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {shiftDetail.transactions.map((txn) => {
                  const txDate = parseNepalDateTime(txn.transactionTime);
                  const isPayIn = txn.transactionType === "pay-in";
                  const isPayOut = txn.transactionType === "pay-out";
                  return (
                    <tr
                      key={txn._id}
                      className="border-t border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-xs text-gray-600">
                        {txDate
                          ? txDate.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : extractTime(txn.transactionTime)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isPayIn
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                              : isPayOut
                                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                                : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                          }`}
                        >
                          {isPayIn ? (
                            <ArrowDownLeft size={9} />
                          ) : isPayOut ? (
                            <ArrowUpRight size={9} />
                          ) : (
                            <Receipt size={9} />
                          )}
                          {txn.transactionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-500">
                        {txn.note || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-500 capitalize">
                        {txn.paymentMethod ?? "—"}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right text-xs font-bold ${isPayIn ? "text-emerald-600" : isPayOut ? "text-red-500" : "text-gray-900"}`}
                      >
                        {isPayIn ? "+" : isPayOut ? "-" : ""}
                        {formatCurrencySymbol(
                          txn.transactionAmount,
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                          {txn.invoiceNo ? `#${txn.invoiceNo}` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Detail Card Sub-component ── */

function DetailCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
        {label}
      </p>
      <p className={`text-sm font-bold ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
