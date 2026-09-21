"use client";

import { Bell, Check, CreditCard, FileText, Mail, Send } from "lucide-react";

import { formatCurrencySymbol } from "@/utils/helper";
import {
  daysFromNepalToday,
  formatNepalDateTime,
  nepalDateString,
} from "@/lib/nepalDate";
import { reminderLabel } from "@/components/invoice/modals/DueDateModal";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import type { Credit, CreditPayment } from "@/services/apiCredit.client";
import type { TicketInvoice } from "@/components/invoice/modals/useInvoiceTicket";
import {
  formatDateLong,
  formatPaymentDate,
  formatTimeShort,
  sortPaymentsDesc,
  type CreditState,
} from "./creditDetailHelpers";

function Connector() {
  return <div className="w-[2px] h-4 bg-gray-600 mb-0 ml-[26px]" />;
}

function StepIcon({
  tone,
  children,
}: {
  tone: "blue" | "green" | "gray";
  children: React.ReactNode;
}) {
  const tones = {
    blue: "border-blue-500 text-blue-600",
    green: "border-green-500 text-green-600 bg-green-50",
    gray: "border-gray-400 text-gray-500 bg-gray-50",
  } as const;

  return (
    <div
      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

/**
 * The life of a credit as three steps: raised, sent, settled.
 *
 * It mirrors the invoice page's timeline so the two read as the same document
 * seen from different sides — but every figure here comes from the credit, not
 * the ticket, and the payment list is the credit's own history.
 */
export default function CreditTimeline({
  credit,
  invoice,
  payments,
  state,
  currency,
  deletingPaymentId,
  onEditInvoice,
  onSendInvoice,
  onSendReminder,
  onRecordPayment,
  onSendReceipt,
  onEditPayment,
  onRemovePayment,
  onSetDueDate,
}: {
  credit: Credit;
  invoice: TicketInvoice | undefined;
  payments: CreditPayment[];
  state: CreditState;
  currency: CurrencyConfig;
  /** Id of the payment currently being deleted, so its row can say so. */
  deletingPaymentId: string | null;
  onEditInvoice: () => void;
  onSendInvoice: () => void;
  onSendReminder: () => void;
  onRecordPayment: () => void;
  /** Receives the payment whose row was clicked, not the credit. */
  onSendReceipt: (payment: CreditPayment) => void;
  onEditPayment: (payment: CreditPayment) => void;
  onRemovePayment: (payment: CreditPayment) => void;
  onSetDueDate: () => void;
}) {
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const isArchived = state === "archived";
  const isCleared = state === "completed";

  /**
   * Nothing is owed, so there is no due date to keep: completed, or the dues
   * have reached zero before the status caught up — the same rule the
   * invoice page uses. The due date, its reminders and "Send reminder" all
   * chase money still outstanding, so the whole box goes.
   */
  const isSettled = isCleared || Number(credit.dueAmount ?? 0) <= 0;

  // ── Due date ──
  // Stored as the instant the day begins in Nepal, so it arrives as the
  // evening before in UTC. Converted rather than sliced — see lib/nepalDate.
  const dueDate = nepalDateString(credit.dueDate);
  const daysUntilDue = daysFromNepalToday(dueDate);
  const schedule = Array.isArray(credit.reminderSchedule)
    ? [...credit.reminderSchedule].sort((a, b) => a - b)
    : [];
  const remindersBefore = schedule.filter((o) => o < 0);
  const remindersAfter = schedule.filter((o) => o >= 0);

  /**
   * When the customer last heard about this credit.
   *
   * `lastReminderAt` is what the API records; the ticket's `sentAt` this used
   * to read is not a field on either document, so the line said "Never" no
   * matter how many reminders had gone out.
   */
  const lastSentAt = formatNepalDateTime(credit.lastReminderAt);

  const formatDueDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const due = credit.dueAmount ?? 0;
  const paid = payments.reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0);
  const ordered = sortPaymentsDesc(payments);

  // Everything that mutates the credit is off once it is archived — the record
  // is kept for reference, not for further work.
  const editable = !isArchived;

  /**
   * A cleared credit's payments are what settled it — editing or removing one
   * afterwards would reopen a balance the customer has already paid. Archived
   * credits are read-only outright.
   */
  const canEditPayments = !isArchived && !isCleared;

  return (
    <div className="space-y-2">
      {/* ── Step 1: the credit was raised ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-0">
        <div className="flex items-center gap-4">
          <StepIcon tone="blue">
            <FileText size={16} />
          </StepIcon>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Credited</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">
                Moved to credit:
              </span>{" "}
              on {formatDateLong(credit.creationDate || credit.createdAt)}
              {formatTimeShort(credit.creationDate || credit.createdAt) &&
                ` at ${formatTimeShort(credit.creationDate || credit.createdAt)}`}{" "}
              GMT+5:45
            </p>
            {invoice?.ticketName && (
              <p className="text-xs text-gray-400 mt-0.5">
                From invoice {invoice.ticketName} #{credit.invoiceNo}
              </p>
            )}
          </div>
          {editable && !isCleared && (
            <button
              onClick={onEditInvoice}
              className="text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors shrink-0"
            >
              Edit invoice
            </button>
          )}
        </div>
      </div>

      <Connector />

      {/* ── Step 2: sending and reminders ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-0">
        <div className="flex items-start gap-4">
          <StepIcon tone="blue">
            {lastSentAt ? <Send size={16} /> : <Mail size={16} />}
          </StepIcon>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Send</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">Last sent:</span>{" "}
              {lastSentAt ?? "Never"}
              {lastSentAt && <span className="text-gray-400"> GMT+5:45</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSendInvoice}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 transition-colors"
            >
              {lastSentAt ? "Send again" : "Send Invoice"}
            </button>
          </div>
        </div>

        {/* Reminders — hidden once settled: see `isSettled`. */}
        {!isSettled && (
          <div className="mt-4 ml-13 border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-700">
                  Due date &amp; automatic reminders
                </p>
              </div>
              {/* An archived credit is a record, so its schedule is frozen with
                everything else that could change it. */}
              {!isArchived && (
                <button
                  onClick={onSetDueDate}
                  className="text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors shrink-0"
                >
                  {dueDate ? "Edit due date" : "Set due date"}
                </button>
              )}
            </div>

            {!dueDate ? (
              // Reminders are all relative to the due date, so there is nothing
              // to schedule against until one exists.
              <p className="text-xs text-gray-500 leading-relaxed">
                No due date set. Add one to schedule reminders before and after
                payment falls due.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Due:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {formatDueDate(dueDate)}
                    </span>
                  </p>
                  {/* Only while something is still owed — on a settled or
                    archived credit the date is history, not a deadline. */}
                  {!isCleared && !isArchived && daysUntilDue !== null && (
                    <span
                      className={`text-[11px] font-semibold ${
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
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Scheduled reminders before due date
                  </p>
                  {remindersBefore.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      None scheduled before the due date.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {remindersBefore.map((offset) => (
                        <span
                          key={offset}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600"
                        >
                          {reminderLabel(offset)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Scheduled reminders after due date
                  </p>
                  {remindersAfter.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      None scheduled once it falls due.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {remindersAfter.map((offset) => (
                        <span
                          key={offset}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                            offset === 0
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-600"
                          }`}
                        >
                          {reminderLabel(offset)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A due reminder is the one action a credit has that a paid invoice
              does not, so it is a first-class button rather than a link. */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {isCleared
                  ? "This credit is settled — nothing is owed."
                  : "Send a due reminder to the customer now"}
              </p>
              <button
                onClick={onSendReminder}
                disabled={isArchived}
                className="text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send reminder
              </button>
            </div>
          </div>
        )}
      </div>

      <Connector />

      {/* ── Step 3: payments against the credit ── */}
      <div
        className={`bg-white border rounded-2xl p-5 ${
          isCleared ? "border-green-100 bg-green-50/30" : "border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <StepIcon tone={isArchived ? "gray" : isCleared ? "green" : "blue"}>
            {isCleared ? <Check size={16} /> : <CreditCard size={16} />}
          </StepIcon>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {isArchived
                ? "Credit archived"
                : isCleared
                  ? "Credit cleared"
                  : "Manage payments"}
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              {isArchived ? (
                <span className="text-gray-500">
                  Archived on {formatDateLong(credit.updatedAt)}
                </span>
              ) : isCleared ? (
                <span className="text-green-600">
                  {fmt(paid)} paid in full across{" "}
                  {payments.length === 1
                    ? "one payment"
                    : `${payments.length} payments`}
                </span>
              ) : (
                <span className="flex flex-row flex-wrap gap-1">
                  {paid > 0 && (
                    <>
                      <span className="text-violet-600 font-semibold">
                        {fmt(paid)}
                      </span>
                      <span>paid so far ·</span>
                    </>
                  )}
                  <span className="text-violet-600 font-semibold">
                    {fmt(due)}
                  </span>
                  <span>remaining on credit</span>
                </span>
              )}
            </p>
          </div>

          {editable && !isCleared && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onRecordPayment}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 transition-colors"
              >
                Record a payment
              </button>
            </div>
          )}
        </div>

        <div className="text-xs ml-13 mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-gray-600">
            <span className="font-medium text-gray-700">Amount due:</span>{" "}
            {isCleared || due <= 0 ? (
              <span className="text-green-600 font-bold">
                {currency.symbol} 0.00
              </span>
            ) : (
              <span className="font-semibold">{fmt(due)}</span>
            )}
            {editable && !isCleared && due > 0 && (
              <>
                {" — "}
                <button
                  onClick={onRecordPayment}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Record a payment
                </button>{" "}
                manually.
              </>
            )}
          </p>

          <p className="text-gray-600">
            <span className="font-medium">Status:</span>{" "}
            {isArchived ? (
              <span className="text-gray-700 font-semibold">
                This credit has been archived
              </span>
            ) : isCleared ? (
              <span className="text-green-700 font-semibold">
                This credit has been fully paid
              </span>
            ) : (
              <span className="text-violet-700 font-semibold">
                This invoice is on credit
              </span>
            )}
          </p>
        </div>

        {/* Payments received */}
        {ordered.length > 0 && (
          <div className="ml-13 mt-5 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Payments received:
            </p>
            <div className="space-y-3">
              {ordered.map((p) => (
                <div key={p._id} className="text-xs">
                  <p className="text-gray-700">
                    {formatPaymentDate(p.paymentDate)} - A payment for{" "}
                    <span className="font-bold">
                      {fmt(p.paymentAmount ?? 0)}
                    </span>{" "}
                    was made using a {p.paymentMethod || "cash"}.
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-blue-600 font-semibold">
                    <button
                      onClick={() => onSendReceipt(p)}
                      className="hover:underline"
                    >
                      Send a receipt
                    </button>

                    {canEditPayments && (
                      <>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => onEditPayment(p)}
                          className="hover:underline"
                        >
                          Edit payment
                        </button>

                        <span className="text-gray-300">·</span>

                        <button
                          onClick={() => onRemovePayment(p)}
                          disabled={deletingPaymentId === p._id}
                          className="hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingPaymentId === p._id
                            ? "Removing..."
                            : "Remove payment"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ordered.length === 0 && !isArchived && (
          <p className="ml-13 mt-5 border-t border-gray-100 pt-4 text-xs text-gray-400">
            No payments recorded against this credit yet.
          </p>
        )}
      </div>
    </div>
  );
}
