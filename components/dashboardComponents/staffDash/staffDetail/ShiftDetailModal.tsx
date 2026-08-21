"use client";

import {
  Clock,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Timer,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { LucideIcon } from "lucide-react";
import type { ShiftDetail } from "./staffDetailHelpers";
import {
  parseNepalDateTime,
  extractTime,
  formatShiftDuration,
} from "./staffDetailHelpers";
import ModalShell from "@/components/ui/ModalShell";

interface ShiftDetailModalProps {
  open: boolean;
  shiftDetail: ShiftDetail | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
}

export default function ShiftDetailModal({
  open,
  shiftDetail,
  loading,
  error,
  onClose,
}: ShiftDetailModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Shift details"
      subtitle={
        shiftDetail
          ? `${shiftDetail.transactions?.length ?? 0} ${
              shiftDetail.transactions?.length === 1
                ? "transaction"
                : "transactions"
            } recorded`
          : "Loading this shift's activity"
      }
      icon={Clock}
      iconColor="text-amber-600"
      iconBgColor="bg-amber-50"
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Loading shift details
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-[13px] font-medium text-gray-500">{error}</p>
        </div>
      ) : shiftDetail ? (
        <ShiftDetailContent shiftDetail={shiftDetail} />
      ) : (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Clock size={20} className="text-gray-300" />
          </div>
          <p className="text-[13px] font-medium text-gray-500">
            No shift details available
          </p>
        </div>
      )}
    </ModalShell>
  );
}

/* ── Shift Detail Content ── */

/** "Mar 4, 09:15 AM", falling back to the raw clock time if unparseable. */
function formatStamp(raw: string | undefined): string {
  if (!raw) return "—";
  return (
    parseNepalDateTime(raw)?.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? extractTime(raw)
  );
}

/** "pay-in" -> "Pay In". */
function formatTxnType(type: string): string {
  return type
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ShiftDetailContent({ shiftDetail }: { shiftDetail: ShiftDetail }) {
  const { currency } = useCurrency();
  const money = (amount: number) =>
    formatCurrencySymbol(amount, currency.symbol, currency.locale);

  const transactions = shiftDetail.transactions ?? [];
  const duration = formatShiftDuration(
    shiftDetail.openingTime,
    shiftDetail.closingTime,
  );

  // Net movement in the drawer. Named for what it actually is - the old
  // "Cash Difference" label reads as a till variance, which this is not.
  const netCashChange = shiftDetail.closingCash - shiftDetail.openingCash;
  const isUp = netCashChange >= 0;

  return (
    <div className="space-y-5">
      {/* Timing */}
      <div>
        <SectionLabel icon={Clock} tone="text-amber-500" bg="bg-amber-50">
          Shift window
        </SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <DetailCard
            label="Opened At"
            value={formatStamp(shiftDetail.openingTime)}
          />
          <DetailCard
            label="Closed At"
            value={formatStamp(shiftDetail.closingTime)}
          />
          <DetailCard
            label="Total Shift Time"
            /* Open shifts have no end yet; the dash matches the shifts table. */
            value={duration ?? "—"}
            icon={Timer}
          />
        </div>
      </div>

      {/* Cash */}
      <div>
        <SectionLabel icon={Wallet} tone="text-emerald-500" bg="bg-emerald-50">
          Cash drawer
        </SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <DetailCard
            label="Opening Cash"
            value={money(shiftDetail.openingCash)}
          />
          <DetailCard
            label="Closing Cash"
            value={money(shiftDetail.closingCash)}
          />
          {shiftDetail.closingTime && (
            <DetailCard
              label="Net Cash Change"
              value={`${isUp ? "+" : ""}${money(netCashChange)}`}
              accent={isUp ? "text-emerald-600" : "text-red-500"}
              icon={isUp ? ArrowDownLeft : ArrowUpRight}
              iconClass={isUp ? "text-emerald-500" : "text-red-400"}
            />
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel icon={Receipt} tone="text-purple-500" bg="bg-purple-50">
            Shift Transactions
          </SectionLabel>
          <span className="ml-auto text-[10px] font-medium text-gray-400">
            {transactions.length}{" "}
            {transactions.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {transactions.length === 0 ? (
          /* Previously the whole block was hidden, so a shift with no
             transactions ended abruptly after the cards with no explanation. */
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
            <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
              <Receipt size={18} className="text-gray-300" />
            </div>
            <p className="text-[13px] font-medium text-gray-500">
              No transactions in this shift
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Pay ins, pay outs and sales will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto ">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-[10px] border-b border-gray-500 uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2.5 text-center font-semibold">
                    Invoice
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold">Note</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Amount{" "}
                  </th>
                  <th className="px-3 pl-2.5 text-center font-semibold">
                    Payment
                  </th>

                  <th className="px-3 py-2.5 text-center font-semibold">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const txDate = parseNepalDateTime(txn.transactionTime);
                  const isPayIn = txn.transactionType === "pay-in";
                  const isPayOut = txn.transactionType === "pay-out";
                  return (
                    <tr
                      key={txn._id}
                      className="border-t border-gray-50 transition-colors last:border-0 hover:bg-gray-50/40"
                    >
                      <td className="px-3 py-2.5 text-center">
                        <span className="  px-2 py-0.5 font-mono text-[11px] text-gray-500">
                          {txn.invoiceNo ? `#${txn.invoiceNo}` : "—"}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-gray-500">
                        {txn.note || "—"}
                      </td>

                      <td
                        className={`px-3 py-2.5 text-right text-xs font-bold tabular-nums ${
                          isPayIn
                            ? "text-emerald-600"
                            : isPayOut
                              ? "text-red-500"
                              : "text-gray-900"
                        }`}
                      >
                        {isPayIn ? "+" : isPayOut ? "-" : ""}
                        {money(txn.transactionAmount)}
                      </td>

                      <td className="px-3 py-2.5 text-xs capitalize text-center text-gray-500">
                        {txn.paymentMethod === "Qr Payment"
                          ? "QR"
                          : (txn.paymentMethod ?? "—")}
                      </td>

                      <td className="px-3 py-2.5 text-center ">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                            isPayIn
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : isPayOut
                                ? "bg-red-50 text-red-700 ring-red-200"
                                : "bg-blue-50 text-blue-700 ring-blue-200"
                          }`}
                        >
                          {isPayIn ? (
                            <ArrowDownLeft size={9} />
                          ) : isPayOut ? (
                            <ArrowUpRight size={9} />
                          ) : (
                            <Receipt size={9} />
                          )}
                          {formatTxnType(txn.transactionType)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-xs text-right tabular-nums text-gray-600">
                        {txDate
                          ? txDate.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : extractTime(txn.transactionTime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* Section label */

function SectionLabel({
  icon: Icon,
  tone,
  bg,
  children,
}: {
  icon: LucideIcon;
  tone: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-md ${bg}`}
      >
        <Icon size={11} className={tone} />
      </div>
      <h4 className="text-xs font-semibold text-gray-700">{children}</h4>
    </div>
  );
}

/* ── Detail Card Sub-component ── */

function DetailCard({
  label,
  value,
  accent,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  accent?: string;
  icon?: LucideIcon;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
      <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-gray-400">
        {label}
      </p>
      <p
        className={`flex items-center gap-1.5 text-[15px] font-bold tabular-nums ${accent ?? "text-gray-900"}`}
      >
        {Icon && (
          <Icon
            size={13}
            className={`shrink-0 ${iconClass ?? "text-gray-400"}`}
          />
        )}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}
