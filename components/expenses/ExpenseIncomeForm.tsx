"use client";

import { useState } from "react";
import { Plus, Settings, ChevronDown, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ManagePurposesModal from "./ManagePurposesModal";
import toast from "react-hot-toast";
import {
  Frequency,
  PURPOSE_COLORS,
  TransactionType,
  useTracker,
} from "@/providers/ExpenseContext";
import BillScanner, { ExtractedExpense } from "./BillScanner";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "yearly"];

export default function ExpenseIncomeForm() {
  const { addTransaction, expensePurposes, incomePurposes } = useTracker();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TransactionType>("expense");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [endDate, setEndDate] = useState("");
  const [managingPurposes, setManagingPurposes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [scannerOpen, setScannerOpen] = useState(false);

  const purposes = tab === "expense" ? expensePurposes : incomePurposes;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!purpose) e.purpose = "Select a purpose";
    if (!amount || parseFloat(amount) <= 0) e.amount = "Enter a valid amount";
    if (!date) e.date = "Select a date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setPurpose("");
    setRemarks("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setRecurring(false);
    setEndDate("");
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addTransaction({
      type: tab,
      purpose,
      remarks,
      amount: parseFloat(amount),
      date,
      recurring,
      frequency: recurring ? frequency : undefined,
      endDate: recurring && endDate ? endDate : undefined,
    });
    toast.success(`${tab === "expense" ? "Expense" : "Income"} added`);
    resetForm();
    setOpen(false);
  };

  const handleExtracted = (extracted: ExtractedExpense) => {
    // Pre-fill the form with extracted data
    if (extracted.amount > 0) setAmount(String(extracted.amount));
    if (extracted.date) setDate(extracted.date);
    if (extracted.remarks) setRemarks(extracted.remarks);

    // Match purpose to available list, fallback to first option
    const matched = (tab === "expense" ? expensePurposes : incomePurposes).find(
      (p) => p.toLowerCase() === extracted.purpose?.toLowerCase(),
    );
    if (matched) setPurpose(matched);
    else if (expensePurposes.includes(extracted.purpose)) {
      setPurpose(extracted.purpose);
    }

    // Show low-confidence warning
    if (extracted.confidence < 0.6) {
      toast("⚠️ Low confidence — please double-check the values", {
        style: { fontSize: "13px" },
      });
    }

    setScannerOpen(false);
  };

  return (
    <>
      {/* ── Trigger button at top right ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
          {/* Main add button */}
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {tab === "expense" ? "Expense" : "Income"}
            </Button>
          </DialogTrigger>

          {/* Scan bill button */}
          <Button
            variant="outline"
            onClick={() => {
              setScannerOpen((p) => !p);
              setOpen(true);
            }}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Bill</span>
          </Button>
        </div>

        <DialogContent className="`max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add Transaction
            </DialogTitle>
          </DialogHeader>

          {/* ── Bill scanner — collapsible ── */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              scannerOpen ? "max-h-96 mb-2" : "max-h-0"
            }`}
          >
            <div className="border border-blue-100 rounded-xl bg-blue-50/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                  <ScanLine size={13} />
                  Auto-fill from bill image
                </p>
                <button
                  onClick={() => setScannerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              </div>
              <BillScanner onExtracted={handleExtracted} />
            </div>
          </div>

          {/* Scan bill toggle inside modal */}
          {!scannerOpen && (
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-blue-200 text-blue-600 text-xs font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              <ScanLine size={13} />
              Auto-fill from bill image
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPurpose("");
                  setErrors({});
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
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

          <div className="space-y-3">
            {/* Purpose */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => setManagingPurposes(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Settings size={11} />
                  Manage
                </button>
              </div>
              <div className="relative">
                <select
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose)
                      setErrors((p) => ({ ...p, purpose: "" }));
                  }}
                  className={`${inputClass} appearance-none pr-8 ${errors.purpose ? "border-red-300" : ""}`}
                >
                  <option value="">Select purpose...</option>
                  {purposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                {purpose && (
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: PURPOSE_COLORS[purpose] ?? "#6b7280",
                    }}
                  />
                )}
              </div>
              {errors.purpose && (
                <p className="text-xs text-red-500 mt-1">{errors.purpose}</p>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Remarks
              </label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Monthly groceries..."
                className={inputClass}
              />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    Rs
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount)
                        setErrors((p) => ({ ...p, amount: "" }));
                    }}
                    placeholder="0.00"
                    className={`${inputClass} pl-8 ${errors.amount ? "border-red-300" : ""}`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="text-xs font-medium text-gray-700">Recurring</p>
                <p className="text-xs text-gray-400">Repeat this transaction</p>
              </div>
              <button
                type="button"
                onClick={() => setRecurring((p) => !p)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  recurring ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    recurring ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Recurring fields */}
            {recurring && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    Frequency
                  </label>
                  <div className="relative">
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as Frequency)
                      }
                      className={`${inputClass} appearance-none pr-8 capitalize`}
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f} className="capitalize">
                          {f}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className={`w-full text-sm rounded-lg py-2.5 ${
                tab === "expense"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              <Plus size={14} className="mr-1.5" />
              Add {tab === "expense" ? "Expense" : "Income"}
            </Button>
          </div>

          <ManagePurposesModal
            open={managingPurposes}
            onClose={() => setManagingPurposes(false)}
            type={tab}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
