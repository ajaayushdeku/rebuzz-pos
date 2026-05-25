"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, FileText, ShoppingBag, DollarSign } from "lucide-react";
import type { Customer } from "./customer-columns";

interface CustomerDetailModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}

const TIER_BG: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-200 text-slate-800",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-indigo-100 text-indigo-800",
};

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
    <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

export default function CustomerDetailModal({
  customer,
  open,
  onClose,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {customer.name}
            </DialogTitle>
            {customer.isDeactivated && (
              <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="mt-2">
          {/* Loyalty section */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                TIER_BG[customer.loyaltyStatus]
              }`}
            >
              {customer.loyaltyStatus}
            </div>
            <div>
              <p className="text-xs text-gray-400">Loyalty Points</p>
              <p className="text-lg font-bold text-gray-900">
                {customer.loyaltyPoint}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-0">
            <DetailRow
              icon={<Mail size={16} />}
              label="Email"
              value={customer.email}
            />
            <DetailRow
              icon={<Phone size={16} />}
              label="Phone"
              value={customer.phone}
            />
            <DetailRow
              icon={<ShoppingBag size={16} />}
              label="Total Purchases"
              value={
                customer.numberOfPurchases !== undefined
                  ? customer.numberOfPurchases
                  : null
              }
            />
            <DetailRow
              icon={<DollarSign size={16} />}
              label="Total Due Amount"
              value={
                customer.totalDueAmount !== undefined
                  ? `$${customer.totalDueAmount.toFixed(2)}`
                  : null
              }
            />
            <DetailRow
              icon={<FileText size={16} />}
              label="Note"
              value={customer.note}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
