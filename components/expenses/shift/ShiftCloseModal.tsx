"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

interface ShiftCloseModalProps {
  open: boolean;
  onClose: () => void;
  expectedAmount: number;
  onConfirm: (closingCash: number) => Promise<void>;
}

export default function ShiftCloseModal({
  open,
  onClose,
  expectedAmount,
  onConfirm,
}: ShiftCloseModalProps) {
  const [closingCash, setClosingCash] = useState(expectedAmount.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { currency } = useCurrency();

  const difference = parseFloat(closingCash || "0") - expectedAmount;

  const handleConfirm = async () => {
    const amt = parseFloat(closingCash);
    if (isNaN(amt)) {
      setError("Please enter a valid closing cash amount.");
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(amt);
      onClose();
    } catch {
      setError("Failed to close shift. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Close Shift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle
              size={14}
              className="text-amber-600 mt-0.5 shrink-0"
            />
            <p className="text-xs text-amber-700">
              This will close the current shift. Make sure all transactions are
              recorded before closing.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Expected Amount</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(expectedAmount, currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Closing Cash
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                Rs
              </span>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => {
                  setClosingCash(e.target.value);
                  if (error) setError("");
                }}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Difference preview */}
          {closingCash && (
            <div
              className={`text-xs font-medium text-right ${
                Math.abs(difference) < 0.01
                  ? "text-green-600"
                  : difference > 0
                    ? "text-blue-600"
                    : "text-red-600"
              }`}
            >
              Difference: {difference >= 0 ? "+" : ""}
              {formatCurrency(difference, currency)}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" />
                  Closing...
                </span>
              ) : (
                "Close Shift"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
