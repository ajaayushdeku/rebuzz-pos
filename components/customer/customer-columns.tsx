"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertCircle } from "lucide-react";
import type { LoyaltyTier } from "@/lib/types/customer";
import { Button } from "../ui/button";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  numberOfPurchases?: number;
  totalDueAmount?: number;
  loyaltyPoint: number;
  loyaltyStatus: LoyaltyTier;
  note?: string | null;
  isDeactivated?: boolean;
};

// ── Tier badge styling ─────────────────────────────────────────────────────

const TIER_STYLES: Record<LoyaltyTier, string> = {
  Bronze: "bg-amber-100 text-amber-800 border-amber-200",
  Silver: "bg-slate-200 text-slate-800 border-slate-300",
  Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Platinum: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

const TierBadge = ({ tier }: { tier: LoyaltyTier }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLES[tier]}`}
  >
    {tier}
  </span>
);

// ── Columns ────────────────────────────────────────────────────────────────

export const getCustomerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-sm  font-medium tracking-wide"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{customer.name}</span>
          {customer.isDeactivated && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Inactive
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "loyaltyPoint",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="text-sm  font-medium tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Points <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-gray-800 flex justify-center">
        {row.getValue("loyaltyPoint")}
      </span>
    ),
  },
  {
    id: "loyaltyStatus",
    accessorKey: "loyaltyStatus",
    header: () => <div className="flex justify-center">Loyalty Status</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <TierBadge tier={row.getValue("loyaltyStatus")} />
      </div>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "numberOfPurchases",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="text-sm  font-medium tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Purchases <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("numberOfPurchases") as number | undefined;
      return (
        <div className="flex justify-center">
          <span className="text-sm text-gray-600">
            {val !== undefined ? val : "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalDueAmount",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="text-sm  font-medium tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const val = row.getValue("totalDueAmount") as number | undefined;
      return (
        <span className="font-semibold flex justify-center">
          {val !== undefined ? `$${val.toFixed(2)}` : "—"}
        </span>
      );
    },
  },
];
