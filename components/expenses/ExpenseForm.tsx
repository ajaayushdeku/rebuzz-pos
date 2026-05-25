"use client";

import { useState, useRef } from "react";
import { Loader2, Plus, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TransactionType = "pay-in" | "pay-out";

interface ExpenseFormProps {
  shiftId: string;
  onCreated: () => void;
}

const typeStyles = {
  "pay-in": "border-green-500 bg-green-50 text-green-700",
  "pay-out": "border-red-500 bg-red-50 text-red-700",
};

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function ExpenseForm({ shiftId, onCreated }: ExpenseFormProps) {
  const [type, setType] = useState<TransactionType>("pay-out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const now = new Date();
      const transactionTime = now
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")
        .slice(0, 23);

      const formData = new FormData();
      formData.append("transactionAmount", String(amt));
      formData.append("transactionType", type);
      formData.append("transactionTime", transactionTime);
      formData.append("note", note);

      if (imageFile) {
        formData.append("billImages", imageFile, imageFile.name);
      }

      const res = await fetch(`/api/shift/expense/${shiftId}`, {
        method: "POST",
        // No Content-Type header — fetch sets multipart/form-data with boundary
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");
      setAmount("");
      setNote("");
      clearImage();
      onCreated();
    } catch {
      setError("Failed to create transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        New Transaction
      </h3>

      {/* Type toggle */}
      <div className="flex gap-2 mb-4">
        {(["pay-in", "pay-out"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition capitalize ${
              type === t
                ? typeStyles[t]
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {t === "pay-in" ? "Pay In" : "Pay Out"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                if (error) setError("");
              }}
              placeholder="0.00"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Staff Pay, Supplier..."
            className={inputClass}
          />
        </div>
      </div>

      {/* ── Image upload ── */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Bill Image (optional)
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Bill preview"
              className="h-20 w-20 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-blue-400 hover:text-blue-600 transition w-full"
          >
            <Image size={14} />
            Upload bill image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !amount}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg px-5 py-2.5 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Adding...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Plus size={14} />
            Add Transaction
          </span>
        )}
      </Button>
    </div>
  );
}
