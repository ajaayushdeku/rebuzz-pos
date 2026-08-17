"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Loader2,
  Settings,
  ArrowDownRight,
  ArrowUpRight,
  Repeat,
} from "lucide-react";
import toast from "react-hot-toast";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalInputError,
  modalSelectTrigger,
  modalSelectTriggerIdle,
  modalSelectTriggerError,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPurposeColor,
  useTracker,
  type TransactionType,
  type Transaction,
} from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";
import ManagePurposesModal from "./ManagePurposesModal";
import { Button } from "../ui/button";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

/** Maximum allowed amount for a transaction (0 – 100,000,000). */
const MAX_AMOUNT = 100_000_000;
const AMOUNT_RANGE_MSG = `Amount must be between 0 and ${MAX_AMOUNT.toLocaleString()}`;

/** Per-tab accent. Expense reads as money out, income as money in. */
const TAB_STYLE = {
  expense: {
    icon: ArrowDownRight,
    iconColor: "text-red-600",
    iconBgColor: "bg-red-50",
    active: "border-red-500 bg-red-50 text-red-700",
    activeIcon: "text-red-500",
    submit: "bg-red-500 hover:bg-red-600",
  },
  income: {
    icon: ArrowUpRight,
    iconColor: "text-emerald-600",
    iconBgColor: "bg-emerald-50",
    active: "border-emerald-500 bg-emerald-50 text-emerald-700",
    activeIcon: "text-emerald-500",
    submit: "bg-emerald-500 hover:bg-emerald-600",
  },
} as const;

type Props = {
  /** When provided, the form opens in edit mode for this transaction */
  editTransaction?: Transaction | null;
  offAddExpense?: boolean;
  /** Callback fired after successful edit */
  onEditSuccess?: () => void;
};

export default function ExpenseIncomeForm({
  editTransaction,
  offAddExpense,
  onEditSuccess,
}: Props = {}) {
  const {
    expensePurposes,
    incomePurposes,
    isPurposesLoading,
    addTransaction,
    updateTransaction,
  } = useTracker();

  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TransactionType>("expense");
  const [managePurposeOpen, setManagePurposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [purposeId, setPurposeId] = useState("");
  const [remark, setRemark] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tracks whether the out-of-range toast has already been shown, so it
  // only fires once per out-of-range state instead of on every keystroke.
  const amountToastShown = useRef(false);

  const isEditing = !!editTransaction;
  const purposes = tab === "expense" ? expensePurposes : incomePurposes;
  const theme = TAB_STYLE[tab];

  // True when the entered amount exceeds the allowed maximum
  const isAmountOutOfRange =
    amount !== "" && !isNaN(Number(amount)) && Number(amount) > MAX_AMOUNT;

  // Initialize form from editTransaction when it changes
  const [initialized, setInitialized] = useState(false);
  if (editTransaction && !initialized) {
    setTab(editTransaction.kind);
    setPurposeId(editTransaction.purposeId);
    setRemark(editTransaction.remark);
    setAmount(String(editTransaction.amount));
    setDate(editTransaction.date);
    setRecurring(editTransaction.isRecurring);
    setFrequency(editTransaction.frequency ?? "monthly");
    setEndDate(editTransaction.endDate ?? "");
    setErrors({});
    setOpen(true);
    setInitialized(true);
  }
  // Reset initialized flag when editTransaction changes
  if (!editTransaction && initialized) {
    setInitialized(false);
  }

  const resetForm = () => {
    setPurposeId("");
    setRemark("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setRecurring(false);
    setFrequency("monthly");
    setEndDate("");
    setErrors({});
  };

  /**
   * Every dismissal path — X, backdrop, Escape, Cancel — runs this. Under the
   * old Dialog the Cancel button closed unconditionally while the X did not,
   * so they could disagree in edit mode; one handler removes that split.
   */
  const handleClose = () => {
    resetForm();
    setOpen(false);
    if (isEditing) onEditSuccess?.();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!purposeId) errs.purpose = "Select a purpose";
    if (!remark.trim()) errs.remark = "Enter a remark";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = "Enter a valid amount";
    else if (Number(amount) > MAX_AMOUNT) errs.amount = AMOUNT_RANGE_MSG;
    if (!date) errs.date = "Select a date";
    if (recurring && !endDate) errs.endDate = "Select an end date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && editTransaction) {
        await updateTransaction(editTransaction._id, {
          kind: tab,
          purposeId,
          remark: remark.trim(),
          amount: Number(amount),
          date,
          isRecurring: recurring,
          frequency: recurring ? frequency : null,
          endDate: recurring && endDate ? endDate : null,
        });
        toast.success("Transaction updated!");
        onEditSuccess?.();
      } else {
        await addTransaction({
          kind: tab,
          purposeId,
          remark: remark.trim(),
          amount: Number(amount),
          date,
          isRecurring: recurring,
          frequency: recurring ? frequency : null,
          endDate: recurring && endDate ? endDate : null,
          otherDetail: null,
        });
        toast.success(`${tab === "expense" ? "Expense" : "Income"} saved!`);
      }
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!isEditing && !offAddExpense && (
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 px-3 md:px-2 py-2.5 text-white rounded-xl text-sm font-semibold flex flex-row gap-1 items-center"
        >
          <Plus size={15} className="h-4 w-4" />
          <span className="hidden lg:block">Add Expense</span>
        </Button>
      )}

      <ModalShell
        open={open}
        onClose={handleClose}
        // ModalShell's Escape listener is on the document, so the stacked
        // purposes modal would close this one too without the guard.
        busy={saving || managePurposeOpen}
        title={isEditing ? "Edit transaction" : "Add transaction"}
        subtitle={
          isEditing
            ? "Update this expense or income entry"
            : "Record a new expense or income"
        }
        icon={theme.icon}
        iconColor={theme.iconColor}
        iconBgColor={theme.iconBgColor}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={modalGhostButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || isAmountOutOfRange}
              className={`${modalPrimaryButton} ${theme.submit}`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update transaction"
              ) : (
                `Add ${tab === "expense" ? "expense" : "income"}`
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* ── Type ──
              Same two-up bordered control the invoice modals use for payment
              method, keeping the red / green accent that distinguishes the
              two kinds of entry. */}
          <div>
            <SectionLabel>Type</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["expense", "income"] as TransactionType[]).map((t) => {
                const active = tab === t;
                const style = TAB_STYLE[t];
                const Icon = style.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setTab(t);
                      setPurposeId("");
                      setErrors({});
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? style.active
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      className={active ? style.activeIcon : "text-gray-400"}
                    />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Purpose ── */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Purpose</SectionLabel>
              <button
                type="button"
                onClick={() => setManagePurposeOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <Settings size={11} /> Manage
              </button>
            </div>

            {isPurposesLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-3 text-[13px] text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Loading purposes...
              </div>
            ) : purposes.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-gray-200 px-3.5 py-3 text-[13px] text-gray-400">
                No {tab} purposes yet. Use “Manage” to add one.
              </div>
            ) : (
              <Select
                value={purposeId}
                onValueChange={(v) => {
                  setPurposeId(v);
                  setErrors((e) => ({ ...e, purpose: "" }));
                }}
              >
                <SelectTrigger
                  className={`mt-2 ${modalSelectTrigger} ${
                    errors.purpose
                      ? modalSelectTriggerError
                      : modalSelectTriggerIdle
                  }`}
                >
                  <SelectValue placeholder="Select a purpose" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {purposes.map((p) => {
                    const Icon = getPurposeIcon(p.icon, p.name);
                    const iconColor = getPurposeColor(p.icon, p.name);
                    return (
                      <SelectItem key={p._id} value={p._id}>
                        <span className="flex items-center gap-2 text-[13px]">
                          <Icon
                            className="size-4"
                            style={{ color: iconColor }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {errors.purpose && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">
                {errors.purpose}
              </p>
            )}
          </div>

          {/* ── Remark ── */}
          <div>
            <SectionLabel>Remark</SectionLabel>
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. This month grocery"
              className={`mt-2 ${modalInput} ${
                errors.remark ? modalInputError : modalInputIdle
              }`}
            />
            {errors.remark && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">
                {errors.remark}
              </p>
            )}
          </div>

          {/* ── Amount + Date ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <SectionLabel>Amount</SectionLabel>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                  {formatCurrencySymbolOnly(currency.symbol)}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    // Allow only digits and a single decimal point — blocks
                    // negative signs, "e", "+", and any other symbols.
                    const raw = e.target.value;
                    const sanitized = raw
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*)\./g, "$1");
                    setAmount(sanitized);
                    if (sanitized && Number(sanitized) > MAX_AMOUNT) {
                      if (!amountToastShown.current) {
                        amountToastShown.current = true;
                        toast.error(AMOUNT_RANGE_MSG);
                      }
                    } else {
                      amountToastShown.current = false;
                    }
                  }}
                  placeholder="0.00"
                  className={`${modalInput} pl-9 tabular-nums ${
                    errors.amount || isAmountOutOfRange ? modalInputError : modalInputIdle
                  }`}
                />
              </div>

              {isAmountOutOfRange && (
                <p className="mt-1.5 text-[11px] font-medium text-red-500">
                  {AMOUNT_RANGE_MSG}
                </p>
              )}
              {errors.amount && (
                <p className="mt-1.5 text-[11px] font-medium text-red-500">
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Date</SectionLabel>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`mt-2 ${modalInput} tabular-nums ${
                  errors.date ? modalInputError : modalInputIdle
                }`}
              />
              {errors.date && (
                <p className="mt-1.5 text-[11px] font-medium text-red-500">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* ── Recurring ──
              Card + switch, matching the loyalty block in RecordPaymentModal:
              the options only appear once the switch is on. */}
          <div className="rounded-xl border border-gray-200 px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                  <Repeat size={13} className="text-gray-400" />
                  Recurring
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Repeat this transaction on a schedule
                </p>
              </div>
              <button
                type="button"
                aria-label="Recurring transaction"
                aria-pressed={recurring}
                onClick={() => setRecurring((p) => !p)}
                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 ${
                  recurring ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    recurring ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {recurring && (
              <div className="mt-3 grid grid-cols-1 gap-4 border-t border-gray-100 pt-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-gray-400">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className={`mt-1.5 ${modalInput} capitalize ${modalInputIdle}`}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f} className="capitalize">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`mt-1.5 ${modalInput} tabular-nums ${
                      errors.endDate ? modalInputError : modalInputIdle
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-500">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* Manage purposes modal */}
      <ManagePurposesModal
        open={managePurposeOpen}
        onClose={() => setManagePurposeOpen(false)}
        type={tab}
      />
    </>
  );
}
