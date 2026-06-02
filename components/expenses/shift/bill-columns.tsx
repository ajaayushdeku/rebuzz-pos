import { CurrencyConfig } from "@/lib/config/store";
import { BillView } from "@/lib/types/expenses";
import { formatCurrency, formatDatetime } from "@/utils/helper";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Badge,
  ChevronDown,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { endOfDay, isWithinInterval, startOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type BillStatus = "Pay In" | "Pay Out" | "Sales";

const statusStyles: Record<BillStatus, { style: string }> = {
  "Pay In": {
    style: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  "Pay Out": {
    style: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  Sales: {
    style: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
};

const paymentMethodStyles: Record<string, string> = {
  Cash: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  QR: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  Split: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

const dateRangeFilter: FilterFn<BillView> = (row, columnId, value) => {
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

const multiSelectFilter: FilterFn<BillView> = (row, columnId, value) => {
  if (!value?.length) return true;
  return value.includes(row.getValue(columnId));
};

export const getBillColumns = (
  currency: CurrencyConfig,
): ColumnDef<BillView>[] => [
  {
    accessorKey: "status",
    header: "Status",
    filterFn: multiSelectFilter,
    cell: ({ row }) => {
      const status: BillStatus = row.getValue("status");
      const s = statusStyles[status];
      return <Badge className={`${s.style}`}>{status}</Badge>;
    },
  },
  {
    accessorKey: "comment",
    header: "Note",
    cell: ({ row }) => {
      const comment = row.getValue("comment") as string | undefined;
      return (
        <span className="text-gray-600 text-sm truncate max-w-[220px] block">
          {comment ?? "—"}
        </span>
      );
    },
  },
  {
    id: "date",
    accessorKey: "created_at",
    filterFn: dateRangeFilter,
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created at
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-gray-600">
        {formatDatetime(row.getValue("date"))}
      </span>
    ),
  },
  {
    accessorKey: "subtotal",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">
        {formatCurrency(Number(row.getValue("subtotal")), currency)}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment",
    cell: ({ row }) => {
      const method = (row.getValue("paymentMethod") as string) ?? "";
      const style = paymentMethodStyles[method] ?? "bg-gray-100 text-gray-700";
      return <Badge className={style}>{method || "—"}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-700 cursor-pointer p-0"
          >
            Actions
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer">
            <Wallet className="w-3.5 h-3.5" />
            Make Payment
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-red-500 text-gray-100 focus:bg-red-700 focus:text-gray-100 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5 text-gray-100" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
