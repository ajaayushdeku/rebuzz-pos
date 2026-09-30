"use client";

import { ColumnDef, FilterFn } from "@tanstack/react-table";

import { ChevronDown, ArrowUpDown, Trash2, Wallet, Pencil } from "lucide-react";

import { formatCurrency, formatDatetime } from "@/utils/helper";

import { Invoice } from "@/lib/types/invoice";
import { CurrencyConfig } from "@/lib/config/store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles: Record<string, string> = {
  Paid: "bg-green-100 text-green-700 hover:bg-green-100 dark:hover:bg-emerald-400/20 dark:text-emerald-300 dark:bg-emerald-400/15",
  unpaid:
    "bg-red-100 text-red-700 hover:bg-red-100 dark:hover:bg-red-400/20 dark:text-red-300 dark:bg-red-400/15",
  Draft:
    "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-[#c3ccdc] dark:bg-white/10",
  Overdue:
    "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-400/20 dark:text-orange-300 dark:bg-orange-400/15",
};

const multiSelectFilter: FilterFn<Invoice> = (row, columnId, value) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(columnId));
};

export const getInvoiceColumns = (
  currency: CurrencyConfig,
): ColumnDef<Invoice>[] => [
  {
    accessorKey: "invoice",
    header: "Invoice #",
    cell: ({ row }) => (
      <span className="font-medium text-gray-900 dark:text-[#e8ecf4]">
        ORD-{row.getValue("invoice")}
      </span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-gray-900 dark:text-[#e8ecf4]">
        {row.getValue("customer_name") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors dark:text-[#e8ecf4]"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-gray-900 dark:text-[#e8ecf4]">
        {formatCurrency(Number(row.getValue("amount")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors dark:text-[#e8ecf4]"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-gray-600 dark:text-[#a9b4c7]">
        {formatDatetime(row.getValue("created_at"))}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={
            statusStyles[status] ??
            "bg-gray-100 text-gray-700 dark:text-[#c3ccdc] dark:bg-white/10"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-700 p-0 dark:hover:text-[#c3d6f4] dark:text-blue-300"
          >
            Actions
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Wallet className="w-3.5 h-3.5" />
            Make Payment
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem className="bg-red-500 text-gray-100 hover:bg-red-600">
            <Trash2 className="w-3.5 h-3.5 text-gray-100" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
