"use client";

import {
  ColumnDef,
  FilterFn,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { getDaysColorCustomers } from "@/lib/utils";

type SpendingLevel = "High" | "Medium" | "Low";

type AtRiskCustomer = {
  rank: number;
  name: string;
  lastVisit: number;
  spendLevel: SpendingLevel;
};

// type AtRiskCustomersProps = {
//   riskCustomers: AtRiskCustomer[];
// };

const spendLevelStyles: Record<
  SpendingLevel,
  { cell: string; badge: string }
> = {
  High: {
    cell: "text-yellow-800",
    badge: "bg-yellow-200",
  },
  Medium: {
    cell: "text-blue-800",
    badge: "bg-blue-200",
  },
  Low: {
    cell: "text-gray-800",
    badge: "bg-gray-200",
  },
};

const multiSelectFilter: FilterFn<
  AtRiskCustomer
> = (row, columnId, value) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(columnId));
};

export const columns: ColumnDef<AtRiskCustomer>[] =
  [
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ row }) => (
        <span>{row.getValue("rank")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span>{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "lastVisit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() === "asc",
            )
          }
        >
          Last Visit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const day =
          row.getValue<number>("lastVisit");
        const { text } =
          getDaysColorCustomers(day);
        return (
          <span
            className={`font-semibold ${text}`}
          >
            {row.getValue("lastVisit")} days ago
          </span>
        );
      },
    },
    {
      header: "Alert Reason",
      cell: () => (
        <p className="border text-sm text-gray-600 border-gray-500 p-1 rounded-2xl w-40 flex items-center justify-center">
          Needs to be worked
        </p>
      ),
    },
    {
      accessorKey: "spendLevel",
      header: "Spending Level",
      filterFn: multiSelectFilter,
      cell: ({ row }) => {
        const level: SpendingLevel =
          row.getValue("spendLevel");
        const s = spendLevelStyles[level];
        return (
          <p
            className={`w-15 flex items-center justify-center ${s.badge} ${s.cell} rounded-lg px-1`}
          >
            {level}
          </p>
        );
      },
    },
    {
      header: "Action",
      cell: () => (
        <Button className="bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-gray-100 border-blue-500 border">
          Send Offer
        </Button>
      ),
    },
  ];
