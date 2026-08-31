"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";

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
    <ModalShell
      open={open}
      onClose={() => handleOpenChange(false)}
      busy={saving}
      title="Update loyalty points"
      subtitle={
        customer?.name
          ? `Adjust the points balance for ${customer.name}`
          : "Adjust the customer's points balance"
      }
      icon={Star}
      iconColor="text-cyan-600"
      iconBgColor="bg-cyan-50"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={modalGhostButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`${modalPrimaryButton} bg-cyan-600/80 hover:bg-cyan-700`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Update points
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Current balance */}
        {customer && (
          <div className="flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100">
                <Star size={15} className="text-cyan-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-tight text-gray-900">
                  Current balance
                </p>
                <p className="mt-0.5 truncate text-[11px] text-gray-400">
                  {customer.name}
                </p>
              </div>
            </div>
            <p className="text-xl font-bold text-cyan-700/80 tabular-nums">
              {(customer.loyaltyPoint ?? 0).toLocaleString()}{" "}
              <span className=" text-[11px] text-cyan-600/80">pts</span>
            </p>
          </div>
        )}

        <div>
          <SectionLabel>Loyalty points</SectionLabel>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-cyan-400">
              ★
            </span>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="0"
              className={`${modalInput} ${modalInputIdle} pl-9 tabular-nums`}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Enter the new total points balance for this customer.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
