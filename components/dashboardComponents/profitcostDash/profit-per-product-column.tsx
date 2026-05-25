"use client";
import { Button } from "@/components/ui/button";
import { CurrencyConfig } from "@/lib/config/store";
import { getMarginColors } from "@/lib/utils";
import { formatCurrency } from "@/utils/helper";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type Product = {
  name: string;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
};

export const getProfitPerProductColumns = (
  currency: CurrencyConfig,
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Revenue
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(Number(row.getValue("revenue")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "cogs",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        COGS
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-red-600">
        -{formatCurrency(Number(row.getValue("cogs")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Profit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-bold text-green-600">
        {formatCurrency(Number(row.getValue("profit")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "margin",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Margin
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const percent = row.getValue<number>("margin");

      const { text } = getMarginColors(percent);
      return (
        <span className={`${text} font-semibold`}>
          {row.getValue("margin")} %
        </span>
      );
    },
  },
];
