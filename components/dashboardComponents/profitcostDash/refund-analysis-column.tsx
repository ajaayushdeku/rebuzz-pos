"use client";

import { ArrowUpDown } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { CurrencyConfig } from "@/lib/config/store";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/helper";

export type RefundReason = {
  name: string;
  loss: number;
  updatedAt: string;
};

export const getRefundReasonColumns = (
  currency: CurrencyConfig,
): ColumnDef<RefundReason>[] => [
  {
    accessorKey: "name",
    header: "Reason",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "count",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Count
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("count")}</span>
    ),
  },
  {
    accessorKey: "loss",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Value Lost
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-red-600">
        -{formatCurrency(Number(row.getValue("loss")), currency)}
      </span>
    ),
  },
];
