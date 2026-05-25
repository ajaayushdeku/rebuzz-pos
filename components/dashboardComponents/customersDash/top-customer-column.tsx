"use client";

import { Button } from "@/components/ui/button";
import { CurrencyConfig } from "@/lib/config/store";
import { formatCurrency } from "@/utils/helper";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type LoyaltyTier = "Gold" | "Silver" | "Bronze" | "None";

export type TopCustomer = {
  rank: number;
  customer: string;
  numVisits: number;
  totalSpent: number;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
};
export type TopCustomersProps = {
  topCustomers: TopCustomer[];
};

export const tierStyles: Record<LoyaltyTier, { cell: string; badge: string }> =
  {
    Gold: {
      cell: "text-yellow-800",
      badge: "bg-yellow-200",
    },
    Silver: {
      cell: "text-gray-800",
      badge: "bg-gray-200",
    },
    Bronze: {
      cell: "text-brown-800",
      badge: "bg-brown-200",
    },
    None: {
      cell: "text-gray-800",
      badge: "bg-gray-200",
    },
  };

const multiSelectFilter: FilterFn<TopCustomer> = (row, columnId, value) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(columnId));
};

export const getTopCustomerColumns = (
  currency: CurrencyConfig,
): ColumnDef<TopCustomer>[] => [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => <span>{row.getValue("rank")}</span>,
  },
  {
    accessorKey: "customer",
    header: "Name",
    cell: ({ row }) => <span>{row.getValue("customer")}</span>,
  },
  {
    accessorKey: "numVisits",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Visits
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("numVisits")}</span>
    ),
  },
  {
    accessorKey: "totalSpent",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Spent
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(Number(row.getValue("totalSpent")), currency)}
        {/* {row.getValue("totalSpent")} */}
      </span>
    ),
  },
  {
    accessorKey: "loyaltyTier",
    header: "Tier",
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const tier: LoyaltyTier = row.getValue("loyaltyTier");
      const s = tierStyles[tier];
      return (
        <p
          className={`${s.badge} ${s.cell} w-12 flex items-center justify-center rounded-lg px-1`}
        >
          {tier}
        </p>
      );
    },
  },
  {
    accessorKey: "loyaltyPoints",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Loyalty Points
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("loyaltyPoints")}</span>
    ),
  },
];
