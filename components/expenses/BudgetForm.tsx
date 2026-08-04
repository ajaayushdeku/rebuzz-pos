"use client";

import { useState, useRef } from "react";
import { Wallet, Trash2, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ManagePurposesModal from "./ManagePurposesModal";
import toast from "react-hot-toast";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { formatCurrencySymbol, formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

/** Maximum allowed amount for a budget threshold (0 – 100,000,000). */
const MAX_AMOUNT = 100_000_000;
const AMOUNT_RANGE_MSG = `Amount must be between 0 and ${MAX_AMOUNT.toLocaleString()}`;

export default function BudgetForm() {
  const { currency } = useCurrency();
  const { addBudget, updateBudget, deleteBudget, budgets, expensePurposes } =
    useTracker();

  const [open, setOpen] = useState(false);
  const [selectedPurposeId, setSelectedPurposeId] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingPurposes, setManagingPurposes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tracks whether the out-of-range toast has already been shown, so it
  // only fires once per out-of-range state instead of on every keystroke.
  const amountToastShown = useRef(false);

  // True when the entered amount exceeds the allowed maximum
  const isAmountOutOfRange =
    amount !== "" &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > MAX_AMOUNT;

  // Get the selected purpose name for display
  const selectedPurpose = expensePurposes.find(
    (p) => p._id === selectedPurposeId,
  );
  const selectedPurposeName = selectedPurpose?.name ?? "";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedPurposeId) e.purpose = "Select a category";
    if (!amount || parseFloat(amount) <= 0) e.amount = "Enter a valid amount";
    else if (parseFloat(amount) > MAX_AMOUNT) e.amount = AMOUNT_RANGE_MSG;
    // Block picking a category that another threshold already uses.
    const clash = budgets.find(
      (b) => b.purposeId === selectedPurposeId && b.id !== editingId,
    );
    if (clash) e.purpose = "This category already has a budget";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setSelectedPurposeId("");
    setAmount("");
    setEditingId(null);
    setErrors({});
  };

  const startEdit = (id: string, purposeId: string, amt: number) => {
    setEditingId(id);
    setSelectedPurposeId(purposeId);
    setAmount(String(amt));
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingId) {
      await updateBudget(editingId, {
        purposeId: selectedPurposeId,
        amount: parseFloat(amount),
      });
      toast.success(`Budget updated for ${selectedPurposeName}`);
    } else {
      await addBudget({
        purposeId: selectedPurposeId,
        amount: parseFloat(amount),
      });
      toast.success(`Budget set for ${selectedPurposeName}`);
    }
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden lg:block"> Set Budget</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {editingId ? "Edit Budget Threshold" : "Set Budget Threshold"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-400 -mt-1 mb-1">
          Set a spending threshold per expense category.
        </p>

        <div className="space-y-3">
          {/* Category / Purpose */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setManagingPurposes(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Settings size={11} />
                Manage
              </button>
            </div>
            <Select
              value={selectedPurposeId}
              onValueChange={(v) => {
                setSelectedPurposeId(v);
                if (errors.purpose) setErrors((p) => ({ ...p, purpose: "" }));
              }}
            >
              <SelectTrigger
                className={`w-full h-10 ${errors.purpose ? "border-red-300" : ""}`}
              >
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {expensePurposes.map((p) => {
                  const Icon = getPurposeIcon(p.icon, p.name);
                  const iconColor = getPurposeColor(p.icon, p.name);
                  return (
                    <SelectItem key={p._id} value={p._id}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" style={{ color: iconColor }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.purpose && (
              <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>
            )}
          </div>

          {/* Budget amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Threshold Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
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
                  if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
                  if (sanitized && parseFloat(sanitized) > MAX_AMOUNT) {
                    if (!amountToastShown.current) {
                      amountToastShown.current = true;
                      toast.error(AMOUNT_RANGE_MSG);
                    }
                  } else {
                    amountToastShown.current = false;
                  }
                }}
                placeholder="0.00"
                className={`${inputClass} pl-8 ${
                  errors.amount || isAmountOutOfRange ? "border-red-300" : ""
                }`}
              />
            </div>
            {isAmountOutOfRange && (
              <p className="text-[10px] text-red-500 mt-1">
                {AMOUNT_RANGE_MSG}
              </p>
            )}
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isAmountOutOfRange}
              className="flex-1 text-sm rounded-lg py-2.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet size={14} className="mr-1.5" />
              {editingId ? "Update Budget" : "Save Budget"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="text-sm rounded-lg py-2.5 border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Existing budgets */}
        {budgets.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Current thresholds
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    editingId === b.id
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: getPurposeColor(
                          expensePurposes.find((p) => p._id === b.purposeId)
                            ?.icon ?? "",
                          expensePurposes.find((p) => p._id === b.purposeId)
                            ?.name ?? b.purposeId,
                        ),
                      }}
                    />
                    <span className="text-xs text-gray-700 truncate">
                      {expensePurposes.find((p) => p._id === b.purposeId)
                        ?.name ?? b.purposeId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrencySymbol(
                        b.amount,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                    <button
                      onClick={() => startEdit(b.id, b.purposeId, b.amount)}
                      className="text-gray-300 hover:text-blue-600 transition-colors"
                      aria-label={`Edit budget for ${expensePurposes.find((p) => p._id === b.purposeId)?.name ?? b.purposeId}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (editingId === b.id) resetForm();
                        deleteBudget(b.id);
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label={`Delete budget for ${expensePurposes.find((p) => p._id === b.purposeId)?.name ?? b.purposeId}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ManagePurposesModal
          open={managingPurposes}
          onClose={() => setManagingPurposes(false)}
          type="expense"
        />
      </DialogContent>
    </Dialog>
  );
}
