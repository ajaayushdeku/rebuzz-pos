"use client";

import { useState, useRef } from "react";
import { Wallet, Trash2, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import ManagePurposesModal from "./ManagePurposesModal";
import toast from "react-hot-toast";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { formatCurrencySymbol, formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

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

  /** Name + icon colour for a stored budget's category. */
  const purposeOf = (purposeId: string) =>
    expensePurposes.find((p) => p._id === purposeId);

  return (
    <>
      {/* ModalShell has no DialogTrigger equivalent — the opener is a plain
          button owning `open` itself. */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden lg:block"> Set Budget</span>
      </Button>

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        // ModalShell's Escape listener is on the document, so the stacked
        // purposes modal would close this one too without the guard.
        busy={managingPurposes}
        title={editingId ? "Edit budget threshold" : "Set budget threshold"}
        subtitle="Set a spending threshold per expense category"
        icon={Wallet}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center gap-2.5">
            {/* Only ends the edit — closing the modal is the X / backdrop,
                which is how it behaved before the shell swap. */}
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className={modalGhostButton}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isAmountOutOfRange}
              className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
            >
              <Wallet size={15} strokeWidth={2} />
              {editingId ? "Update budget" : "Save budget"}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* ── Category ── */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>
                Category <span className="text-red-500">*</span>
              </SectionLabel>
              <button
                type="button"
                onClick={() => setManagingPurposes(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
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
                className={`mt-2 ${modalSelectTrigger} ${
                  errors.purpose
                    ? modalSelectTriggerError
                    : modalSelectTriggerIdle
                }`}
              >
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {expensePurposes.map((p) => {
                  const Icon = getPurposeIcon(p.icon, p.name);
                  const iconColor = getPurposeColor(p.icon, p.name);
                  return (
                    <SelectItem key={p._id} value={p._id}>
                      <span className="flex items-center gap-2 text-[13px]">
                        <Icon className="size-4" style={{ color: iconColor }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {errors.purpose && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">
                {errors.purpose}
              </p>
            )}
          </div>

          {/* ── Threshold amount ── */}
          <div>
            <SectionLabel>
              Threshold amount <span className="text-red-500">*</span>
            </SectionLabel>

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
                className={`${modalInput} pl-9 tabular-nums ${
                  errors.amount || isAmountOutOfRange
                    ? modalInputError
                    : modalInputIdle
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

          {/* ── Existing thresholds ── */}
          {budgets.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <SectionLabel>Current thresholds</SectionLabel>
              <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {budgets.map((b) => {
                  const purpose = purposeOf(b.purposeId);
                  const name = purpose?.name ?? b.purposeId;
                  const isEditingRow = editingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                        isEditingRow
                          ? "border-blue-600 bg-blue-50/60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: getPurposeColor(
                              purpose?.icon ?? "",
                              name,
                            ),
                          }}
                        />
                        <span className="truncate text-[13px] font-medium text-gray-900">
                          {name}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[13px] font-semibold text-gray-700 tabular-nums">
                          {formatCurrencySymbol(
                            b.amount,
                            currency.symbol,
                            currency.locale,
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(b.id, b.purposeId, b.amount)
                          }
                          className="text-gray-300 transition-colors hover:text-blue-600"
                          aria-label={`Edit budget for ${name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingRow) resetForm();
                            deleteBudget(b.id);
                          }}
                          className="text-gray-300 transition-colors hover:text-red-500"
                          aria-label={`Delete budget for ${name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      <ManagePurposesModal
        open={managingPurposes}
        onClose={() => setManagingPurposes(false)}
        type="expense"
      />
    </>
  );
}
