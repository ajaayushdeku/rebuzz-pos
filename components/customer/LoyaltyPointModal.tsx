"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

/**
 * Update a customer's loyalty points. Shared by the customers table and the
 * customer detail page.
 */
export default function LoyaltyPointModal({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [points, setPoints] = useState(String(customer?.loyaltyPoint ?? 0));
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && customer) setPoints(String(customer.loyaltyPoint ?? 0));
    if (!nextOpen) onClose();
  };

  const handleSave = async () => {
    if (!customer?.id) return;
    const value = parseFloat(points);
    if (isNaN(value) || value < 0) {
      toast.error("Enter a valid point value");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/loyalty-point`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loyaltyPoint: value }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Loyalty points updated");
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      onClose();
    } catch {
      toast.error("Failed to update loyalty points");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Update Loyalty Points"
      description={
        customer?.name
          ? `Adjust the points balance for ${customer.name}`
          : "Adjust the customer's points balance"
      }
      widthClass="sm:max-w-sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={modalPrimaryBtn}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Update Points"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Current balance */}
        {customer && (
          <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Star size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Current Balance
                </p>
                <p className="text-[11px] text-gray-400">{customer.name}</p>
              </div>
            </div>
            <p className="text-xl font-bold text-amber-600">
              {(customer.loyaltyPoint ?? 0).toLocaleString()}
            </p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Loyalty Points
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs">
              ★
            </span>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className={`${inputClass} pl-7`}
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Enter the new total points balance for this customer.
          </p>
        </div>
      </div>
    </SettingsModalShell>
  );
}
