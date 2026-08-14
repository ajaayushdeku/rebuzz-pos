"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import ModalShell from "@/components/ui/ModalShell";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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
    // <SettingsModalShell
    //   open={open}
    //   onOpenChange={handleOpenChange}
    //   title="Update Loyalty Points"
    //   description={
    //     customer?.name
    //       ? `Adjust the points balance for ${customer.name}`
    //       : "Adjust the customer's points balance"
    //   }
    //   widthClass="sm:max-w-sm"

    <ModalShell
      open={open}
      onClose={() => handleOpenChange(false)}
      // busy={isPending}
      title="Update Loyalty Points"
      subtitle={
        customer?.name
          ? `Adjust the points balance for ${customer.name}`
          : "Adjust the customer's points balance"
      }
      icon={Star}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
        </div>
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
                <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                  Current Balance
                </p>
                <p className="text-[11px] text-gray-400 tracking-[0.1em]  font-mono">
                  {customer.name}
                </p>
              </div>
            </div>
            <p className="text-xl font-bold text-amber-600">
              {(customer.loyaltyPoint ?? 0).toLocaleString()}
            </p>
          </div>
        )}

        <div>
          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
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
    </ModalShell>
  );
}
