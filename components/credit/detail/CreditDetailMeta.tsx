"use client";

import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import { daysFromNepalToday } from "@/lib/nepalDate";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import {
  CREDIT_STATE_LABEL,
  CREDIT_STATE_PILL,
  type CreditState,
} from "./creditDetailHelpers";

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-right font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

/**
 * The figure row above the timeline: what state the credit is in, whose it is,
 * and what is still owed.
 *
 * Paid-so-far sits next to the due amount rather than only inside the payment
 * list — on a part-paid credit the two numbers only mean something together.
 */
export default function CreditDetailMeta({
  state,
  customerName,
  customerPhone,
  loyaltyPoint,
  isCustomerLoading,
  dueAmount,
  paidAmount,
  grandTotal,
  currency,
  dueDate,
  onSetDueDate,
}: {
  state: CreditState;
  customerName: string;
  customerPhone?: string;
  loyaltyPoint?: number;
  isCustomerLoading: boolean;
  dueAmount: number;
  paidAmount: number;
  grandTotal: number;
  currency: CurrencyConfig;
  /** Nepal calendar day, YYYY-MM-DD, or null when none is set. */
  dueDate: string | null;
  onSetDueDate: () => void;
}) {
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);
  const pill = CREDIT_STATE_PILL[state];
  const cleared = state !== "ongoing" || dueAmount <= 0;

  const daysUntilDue = daysFromNepalToday(dueDate);

  /**
   * Nothing is owed, so there is no due date to show or set: completed, or the
   * dues have reached zero before the status caught up. Unlike `cleared`,
   * an archived credit with money still owed keeps its date — archiving
   * freezes a record, it does not settle it.
   */
  const isSettled = state === "completed" || dueAmount <= 0;

  /**
   * Built from the parts, never `new Date(iso)`, which reads a bare date as UTC
   * midnight and renders the day before in any negative offset.
   */
  const formatDueDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-[10px] text-left font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Status
          </p>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border relative overflow-hidden capitalize ${pill.className}`}
            style={pill.style}
          >
            {CREDIT_STATE_LABEL[state]}
          </span>
        </div>

        <div>
          <p className="text-[10px] text-left font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Customer
          </p>
          {isCustomerLoading ? (
            <div className="h-5 w-28 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-base font-bold text-blue-600">
                {customerName}
              </span>
              {/* {customerPhone && (
                <span className="text-[11px] text-gray-400 mb-0.5">
                  {customerPhone}
                </span>
              )} */}
              {!!loyaltyPoint && loyaltyPoint > 0 && (
                <p className="text-[10px] text-amber-500 font-medium whitespace-nowrap mb-0.5 font-sans">
                  ★ {formatAmount(loyaltyPoint, currency.locale)}{" "}
                  <span className=" text-[8px] text-amber-400 font-medium whitespace-nowrap mb-0.5">
                    pts
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row gap-6 font-sans">
        {/* Hidden once settled: see `isSettled`. */}
        {!isSettled && (
          <div>
            <MetaLabel>Due date</MetaLabel>
            {dueDate ? (
              <div className="text-right relative">
                <p className="text-xl font-semibold text-gray-800">
                  {formatDueDate(dueDate)}
                </p>
                {/* How long is left, and only while something is still owed — on
                  a settled or archived credit the date is a record, not a
                  deadline. */}
                {!cleared && daysUntilDue !== null && (
                  <p
                    className={` absolute right-0 text-[11px] font-semibold mt-0.5 ${
                      daysUntilDue < 0
                        ? "text-red-500"
                        : daysUntilDue === 0
                          ? "text-amber-600"
                          : "text-gray-400"
                    }`}
                  >
                    {daysUntilDue < 0
                      ? `${Math.abs(daysUntilDue)} ${
                          Math.abs(daysUntilDue) === 1 ? "day" : "days"
                        } overdue`
                      : daysUntilDue === 0
                        ? "Due today"
                        : `in ${daysUntilDue} ${
                            daysUntilDue === 1 ? "day" : "days"
                          }`}
                  </p>
                )}
              </div>
            ) : state === "archived" ? (
              // Nothing about an archived credit can change, so a button here
              // would open a form that cannot be saved.
              <p className="text-base text-right font-semibold text-gray-300">
                —
              </p>
            ) : (
              // A button rather than a dash: the row is where someone looks for
              // the date, so it is also where they should be able to add one.
              <button
                onClick={onSetDueDate}
                className="text-base font-semibold text-blue-600 tracking-wide cursor-pointer hover:underline"
              >
                Set due date
              </button>
            )}
          </div>
        )}

        <div>
          <MetaLabel>Credit total</MetaLabel>
          <p className="text-xl text-right font-semibold text-gray-800">
            {fmt(grandTotal)}
          </p>
        </div>

        {paidAmount > 0 && (
          <div>
            <MetaLabel>Paid so far</MetaLabel>
            <p className="text-xl text-right font-semibold text-green-600">
              {fmt(paidAmount)}
            </p>
          </div>
        )}

        <div>
          <MetaLabel>Amount due</MetaLabel>
          <p
            className={`text-xl text-right font-semibold ${
              cleared ? "text-green-600" : "text-red-600"
            }`}
          >
            {fmt(cleared ? 0 : dueAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
