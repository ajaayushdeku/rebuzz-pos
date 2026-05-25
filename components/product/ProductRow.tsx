import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TableCell, TableRow } from "../ui/table";
import { formatCurrency, formatCurrencyChangeLater } from "@/utils/helper";

import toast from "react-hot-toast";
import { ProductRowProps } from "@/lib/types/product";
// import { useDeleteProduct } from "@/hooks/useProducts";

export default function ProductRow({ product }: ProductRowProps) {
  const { image, id: productId, name, price, categories } = product;

  // const deleteProductMutation =
  //   useDeleteProduct();

  // const handleDelete = () => {
  //   if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
  //     deleteProductMutation.mutate(productId, {
  //       onSuccess: () => {
  //         toast.success(`Product "${name}" deleted successfully`);
  //       },
  //       onError: (error: Error) => {
  //         toast.error(`Failed to delete customer: ${error.message}`);
  //       },
  //     });
  //   }
  // };
  return (
    <TableRow key={productId} className="border-b last:border-0">
      <TableCell>{image || "T-T"}</TableCell>
      <TableCell className="font-medium text-gray-900">{name || "-"}</TableCell>
      <TableCell className="text-gray-700">{categories || "—"}</TableCell>

      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">
            {formatCurrencyChangeLater(price)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-blue-200 hover:bg-blue-50"
            >
              <ChevronDown className="h-4 w-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          {/* <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>

            <DropdownMenuItem
              className="text-red-600"
              onClick={handleDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending
                ? "Deleting product..."
                : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent> */}
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
