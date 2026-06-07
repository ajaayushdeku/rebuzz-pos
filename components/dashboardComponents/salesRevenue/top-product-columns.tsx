"use client";

import { ColumnDef } from "@tanstack/react-table";
import { getPercentColor } from "@/lib/utils";
import { CurrencyConfig } from "@/lib/config/store";
import { formatCurrency } from "@/utils/helper";

export type TopProduct = {
  name: string;
  category: string;
  revenue: number;
  percent: number;
  count: number;
  netProfit: number;
};

export const getTopProductColumns = (
  currency: CurrencyConfig,
): ColumnDef<TopProduct>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(Number(row.getValue("revenue")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "percent",
    header: "Growth",
    cell: ({ row }) => {
      const percent = row.getValue<number>("percent");
      const { badge, ArrowIcon } = getPercentColor(percent);
      return (
        <p
          className={`w-14 flex items-center justify-center rounded-lg ${badge} px-1`}
        >
          <ArrowIcon size={14} />
          {percent}%
        </p>
      );
    },
  },
];
