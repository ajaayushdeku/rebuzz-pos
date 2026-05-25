"use client";

import { useState } from "react";
import { Loader2, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShiftOpenFormProps {
  onOpen: (openingCash: number) => Promise<void>;
  isLoading: boolean;
}

export default function ShiftOpenForm({
  onOpen,
  isLoading,
}: ShiftOpenFormProps) {
  const [openingCash, setOpeningCash] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid opening cash amount.");
      return;
    }
    setError("");
    await onOpen(amount);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Open Shift</h2>
            <p className="text-sm text-gray-400">Enter opening cash to begin</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Opening Cash Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                min={0}
                value={openingCash}
                onChange={(e) => {
                  setOpeningCash(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !openingCash}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Opening shift...
              </span>
            ) : (
              "Open Shift"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
