"use client";

import { Button } from "@/components/ui/button";
import { getDaysColor } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export type SlowProduct = {
  /** Display name — "Momo (buff · large)" for a variant row. */
  name: string;
  days: number;
  stockAmount: number;
  /** Parent product name; set only on variant rows. */
  productName?: string;
  /** Option values joined for display; set only on variant rows. */
  variantLabel?: string;
};

export const slowProductColumns: ColumnDef<SlowProduct>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "days",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Days Idle
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const day = row.getValue<number>("days");
      const { text } = getDaysColor(day);
      return (
        <span className={`font-semibold ${text}`}>
          {row.getValue("days")} days
        </span>
      );
    },
  },
  {
    accessorKey: "stockAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-gray-500">{row.getValue("stockAmount")} units</span>
    ),
  },
];
