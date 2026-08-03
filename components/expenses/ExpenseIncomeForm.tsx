"use client";

import { useState } from "react";
import { Plus, Loader2, Settings } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

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

  const isEditing = !!editTransaction;
  const purposes = tab === "expense" ? expensePurposes : incomePurposes;

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!purposeId) errs.purpose = "Select a purpose";
    if (!remark.trim()) errs.remark = "Enter a remark";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = "Enter a valid amount";
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

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            resetForm();
            if (isEditing) onEditSuccess?.();
          }
          if (!isEditing) setOpen(o);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>

          {/* ── Tabs ── */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPurposeId("");
                  setErrors({});
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  tab === t
                    ? t === "expense"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-green-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Purpose selector ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">
                Purpose
              </label>
              <button
                onClick={() => setManagePurposeOpen(true)}
                className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700"
              >
                <Settings size={11} /> Manage
              </button>
            </div>
            {isPurposesLoading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                <Loader2 size={13} className="animate-spin" /> Loading
                purposes...
              </div>
            ) : purposes.length === 0 ? (
              <div className="py-3 text-xs text-gray-400">
                No {tab} purposes yet. Click “Manage” to add one.
              </div>
            ) : (
              <Select
                value={purposeId}
                onValueChange={(v) => {
                  setPurposeId(v);
                  setErrors((e) => ({ ...e, purpose: "" }));
                }}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select a purpose" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {purposes.map((p) => {
                    const Icon = getPurposeIcon(p.icon, p.name);
                    const iconColor = getPurposeColor(p.icon, p.name);
                    return (
                      <SelectItem key={p._id} value={p._id}>
                        <span className="flex items-center gap-2">
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
              <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>
            )}
          </div>

          {/* ── Remark ── */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Remark
            </label>
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. This month grocery"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.remark && (
              <p className="text-xs text-red-500 mt-1">{errors.remark}</p>
            )}
          </div>

          {/* ── Amount + Date ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Amount
              </label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* ── Recurring toggle ── */}
          <div className="flex items-center justify-between py-1.5 border-t border-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-700">Recurring</p>
              <p className="text-[10px] text-gray-400">
                Repeat this transaction
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRecurring((p) => !p)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
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

          {/* ── Recurring options ── */}
          {recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f} className="capitalize">
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                resetForm();
                setOpen(false);
                if (isEditing) onEditSuccess?.();
              }}
              className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`flex-1 py-2.5 text-sm text-white rounded-xl transition-colors font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                tab === "expense"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : `Add ${tab === "expense" ? "Expense" : "Income"}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage purposes modal */}
      <ManagePurposesModal
        open={managePurposeOpen}
        onClose={() => setManagePurposeOpen(false)}
        type={tab}
      />
    </>
  );
}
