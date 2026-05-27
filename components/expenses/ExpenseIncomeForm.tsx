"use client";

import { useState } from "react";
import { Plus, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
// import {
//   useTracker,
//   TransactionType,
//   Frequency,
//   PURPOSE_COLORS,
// } from "./TrackerContext";
import ManagePurposesModal from "./ManagePurposesModal";
import toast from "react-hot-toast";
import {
  Frequency,
  PURPOSE_COLORS,
  TransactionType,
  useTracker,
} from "@/providers/ExpenseContext";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "yearly"];

export default function ExpenseIncomeForm() {
  const { addTransaction, expensePurposes, incomePurposes } = useTracker();
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

  const purposes = tab === "expense" ? expensePurposes : incomePurposes;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!purpose) e.purpose = "Select a purpose";
    if (!amount || parseFloat(amount) <= 0) e.amount = "Enter a valid amount";
    if (!date) e.date = "Select a date";
    setErrors(e);
    return Object.keys(e).length === 0;
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
    setPurpose("");
    setRemarks("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setRecurring(false);
    setEndDate("");
    setErrors({});
    toast.success(`${tab === "expense" ? "Expense" : "Income"} added`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
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
                if (errors.purpose) setErrors((p) => ({ ...p, purpose: "" }));
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
                  if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
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
          <div className="grid grid-cols-2 gap-3 pt-1 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Frequency
              </label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
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
    </div>
  );
}
