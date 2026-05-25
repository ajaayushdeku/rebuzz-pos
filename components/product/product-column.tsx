import { ColumnDef } from "@tanstack/react-table";

import { ArrowUpDown, Percent, Package, Pencil, Trash2 } from "lucide-react";

import { Product } from "@/lib/types/product";
import { CurrencyConfig } from "@/lib/config/store";

import { Button } from "../ui/button";
import { formatCurrency } from "@/utils/helper";
import { Badge } from "../ui/badge";

export const getProductColumns = (
  currency: CurrencyConfig,
  onEdit?: (product: Product) => void,
  onDelete?: (product: Product) => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc: string = row.getValue("description") ?? "";
      return (
        <span className="text-sm text-gray-500 truncate max-w-[200px] block">
          {desc || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-sm  font-medium tracking-wide"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900">
        {formatCurrency(row.getValue("price"), currency)}
      </span>
    ),
  },
  {
    id: "isTaxable",
    header: "Tax",
    cell: ({ row }) => {
      const isTaxable = row.original.isTaxable;
      return (
        <Badge
          className={
            isTaxable
              ? "bg-green-50 text-green-700 border border-green-200 font-medium"
              : "bg-gray-50 text-gray-400 border border-gray-200 font-medium"
          }
        >
          {isTaxable ? (
            <>
              <Percent className="h-3 w-3 mr-1" />
              Taxable
            </>
          ) : (
            "Non-taxable"
          )}
        </Badge>
      );
    },
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const product = row.original;
      if (!product.usesStocks)
        return <span className="text-xs text-gray-400">Not tracked</span>;
      return (
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {product.inStock ?? 0}
          </span>
          {product.lowStock !== undefined && product.lowStock > 0 && (
            <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-1.5 py-0">
              Low: {product.lowStock}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
            title="Edit product"
            onClick={() => onEdit?.(product)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500"
            title="Delete product"
            onClick={() => onDelete?.(product)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
  },
];
