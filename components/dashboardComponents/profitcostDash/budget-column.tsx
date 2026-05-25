"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CurrencyConfig } from "@/lib/config/store";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/utils/helper";

type BudgetCategory =
  | "Labor"
  | "COGS"
  | "Rent"
  | "Utilities"
  | "Marketing"
  | "Supplies"
  | "Maintenance";

const categoryColors: Record<BudgetCategory, string> = {
  Labor: "bg-blue-500",
  COGS: "bg-purple-500",
  Rent: "bg-pink-500",
  Utilities: "bg-orange-400",
  Marketing: "bg-green-500",
  Supplies: "bg-teal-400",
  Maintenance: "bg-violet-400",
};

// Fallback for any category the backend sends that isn't mapped
export function getCategoryColor(category: string): string {
  return categoryColors[category as BudgetCategory] ?? "bg-gray-400";
}

export type BudgetItem = {
  category: string;
  actual: number;
  budget: number;
};

export const getBudgetColumns = (
  currency: CurrencyConfig,
): ColumnDef<BudgetItem>[] => [
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const color = getCategoryColor(row.original.category);
      return (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span>{row.getValue("category")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "actual",
    header: "Actual",
    cell: ({ row }) => (
      <span className="font-bold">
        {formatCurrency(Number(row.getValue("actual")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => (
      <span className="text-gray-500">
        {formatCurrency(Number(row.getValue("budget")), currency)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const color = getCategoryColor(row.original.category);
      const percentage = Math.round(
        (row.original.actual / row.original.budget) * 100,
      );
      return <ProgressBar percentage={percentage} color={color} />;
    },
  },
];
