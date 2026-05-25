"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pen, Trash2 } from "lucide-react";

import { CurrencyConfig } from "@/lib/config/store";

import { Button } from "../../ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/helper";

type ProductServiceType = "Product" | "Service";

const productServiceTypeStyles: Record<ProductServiceType, { style: string }> =
  {
    Product: {
      style: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    Service: {
      style: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
  };

export type ProductService = {
  type: "Product" | "Service";
  id: string;
  name: string;
  price: number;
  description: string;
};
export const getProductServiceColumns = (
  currency: CurrencyConfig,
): ColumnDef<ProductService>[] => [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const types: ProductServiceType = row.getValue("type");
      const s = productServiceTypeStyles[types];
      return (
        // <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
        //   {row.getValue("type")}
        // </span>
        <Badge className={`${s.style}`}>{types}</Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-slate-800">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-slate-500">
        {row.getValue("description") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-slate-600 hover:text-slate-900 px-0 font-medium"
      >
        Price
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-slate-800 tabular-nums">
        {formatCurrency(row.getValue("price"), currency)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-blue-400 hover:text-slate-700 hover:bg-blue-50"
        >
          <Pen className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  },
];
// export const getProductServiceColumns = (
//   currency: CurrencyConfig,
// ): ColumnDef<ProductService>[] => [
//   {
//     accessorKey: "name",
//     header: "Name",
//     cell: ({ row }) => (
//       <span>{row.getValue("name")}</span>
//     ),
//   },
//   {
//     accessorKey: "description",
//     header: "Description",
//     cell: ({ row }) => (
//       <span>{row.getValue("description")}</span>
//     ),
//   },
//   {
//     accessorKey: "price",
//     header: ({ column }) => (
//       <Button
//         variant="ghost"
//         onClick={() =>
//           column.toggleSorting(
//             column.getIsSorted() === "asc",
//           )
//         }
//       >
//         Price
//         <ArrowUpDown className="ml-2 h-4 w-4" />
//       </Button>
//     ),
//     cell: ({ row }) => (
//       <span className="font-semibold">
//         {formatCurrency(
//           row.getValue("price"),
//           currency,
//         )}
//       </span>
//     ),
//   },
//   {
//     id: "actions",
//     header: "Actions",
//     cell: () => (
//       <div className="flex gap-3 hover:bg-muted/50">
//         <button className="bg-white text-blue-800   cursor-pointer">
//           {/* <Pencil /> */}
//           <Pen size={20} strokeWidth={2} />
//         </button>
//         <button className="bg-white text-blue-800 hover:text-red-800  cursor-pointer">
//           <Trash2 size={20} strokeWidth={2} />
//         </button>
//       </div>
//     ),
//   },
// ];
