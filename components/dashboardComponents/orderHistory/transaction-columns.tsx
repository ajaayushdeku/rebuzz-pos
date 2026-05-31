"use client";

import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { CurrencyConfig } from "@/lib/config/store";
import { Button } from "@/components/ui/button";
import {
  PaymentMethod,
  paymentMethods,
  statusStyles,
  TransactionStatus,
} from "@/lib/config/transaction";
import { formatCurrency } from "@/utils/helper";

type Item = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Transaction = {
  id: string;
  date: string;
  timestamp: string;
  invoiceName: string;
  amount: string;
  paymentMethod: PaymentMethod;
  items: Item[];
  status: TransactionStatus;
  businessName?: string;
  generatedBy?: string;
  totalAmount?: number;
  discount?: number;
  taxAmount?: number;
  cashAmount?: number;
  qrAmount?: number;
  invoiceNo?: number;
  billNo?: number;
  isRefunded?: boolean;
  currentPoint?: number;
  totalPoints?: number;
  createdAt?: string;
  updatedAt?: string;
  discountByPoints?: number;
  // Only populated in detail response
  customer?: { name: string; email: string; phone: string } | null;
};

export const dateRangeFilter: FilterFn<Transaction> = (
  row,
  columnId,
  value,
) => {
  const { from, to } = value as {
    from: Date | undefined;
    to: Date | undefined;
  };
  if (!from && !to) return true;
  const rowDate = row.getValue(columnId) as Date;
  if (from && !to) return rowDate >= startOfDay(from);
  if (!from && to) return rowDate <= endOfDay(to);
  return isWithinInterval(rowDate, {
    start: startOfDay(from!),
    end: endOfDay(to!),
  });
};

export const multiSelectFilter: FilterFn<Transaction> = (
  row,
  columnId,
  value,
) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(columnId));
};

export const getTransactionColumns = (
  currency: CurrencyConfig,
): ColumnDef<Transaction>[] => [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("id")}</span>
    ),
  },
  {
    id: "date",
    accessorFn: (row) => new Date(`${row.date} ${row.timestamp}`),
    filterFn: dateRangeFilter,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date / Time <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-[14px] font-semibold">{row.original.timestamp}</p>
        <p className="text-[12px] text-gray-600">{row.original.date}</p>
      </div>
    ),
    sortingFn: "datetime",
  },

  // ── Reuse customer column to show invoiceName from list,
  //    customer.name shown in modal after detail fetch ──────────────────────
  {
    accessorKey: "invoiceName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer / Invoice <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const invoiceName = row.original.invoiceName;
      const customerName = row.original.customer?.name;
      return (
        <div>
          {/* Show customer name if detail already loaded, else invoiceName */}
          <p className="font-semibold text-sm">
            {customerName || invoiceName || "—"}
          </p>
          {/* Show invoiceName as sub-label if customer name is different */}
          {customerName && customerName !== invoiceName && (
            <p className="text-xs text-gray-400">{invoiceName}</p>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "paymentMethod",
    header: "Payment",
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const method: PaymentMethod = row.getValue("paymentMethod");
      const s = paymentMethods[method];
      return (
        <p
          className={`${s.badge} ${s.cell} w-20 px-1 py-0.5 flex items-center justify-center rounded-lg`}
        >
          {method}
        </p>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-bold">
        {formatCurrency(Number(row.getValue("amount")), currency)}
      </span>
    ),
    sortingFn: (a, b) =>
      parseFloat(a.original.amount) - parseFloat(b.original.amount),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const status: TransactionStatus = row.getValue("status");
      const s = statusStyles[status];
      return (
        <p
          className={`${s.badge} ${s.cell} w-20 px-1 py-0.5 flex items-center justify-center rounded-lg`}
        >
          {status}
        </p>
      );
    },
  },
];
