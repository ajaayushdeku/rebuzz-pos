"use client";

import { Bell, Loader2 } from "lucide-react";
import { formatCurrencySymbol } from "@/utils/helper";
import type { Credit } from "@/services/apiCredit.client";
import type { CurrencyConfig } from "@/providers/CurrencyContext";
import ModalShell from "@/components/ui/ModalShell";

interface SendReminderModalProps {
  open: boolean;
  onClose: () => void;
  credit: Credit | null;
  currency: CurrencyConfig;
  reminderMessage: string;
  onMessageChange: (message: string) => void;
  sendingReminder: boolean;
  onSubmit: () => void;
}

export default function SendReminderModal({
  open,
  onClose,
  credit,
  currency,
  reminderMessage,
  onMessageChange,
  sendingReminder,
  onSubmit,
}: SendReminderModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={sendingReminder}
      title="Send reminder"
      subtitle={
        credit
          ? `${credit.user?.name || "Customer"} · Due ${formatCurrencySymbol(credit.dueAmount ?? 0, currency.symbol, currency.locale)}`
          : "Send a reminder to the customer"
      }
      icon={Bell}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Reminder message
          </label>
          <textarea
            rows={3}
            value={reminderMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write a reminder message..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={sendingReminder}
            className="flex-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={sendingReminder || !reminderMessage.trim()}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {sendingReminder ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send reminder"
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
