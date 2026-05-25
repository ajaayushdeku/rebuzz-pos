"use client";

import {
  getProductServiceColumns,
  ProductService,
} from "./productservice-columns";
import { DataTable } from "../../ui/data-table";
import { useCurrency } from "@/providers/CurrencyContext";

export default function ProductServiceTable({
  productService,
}: {
  productService: ProductService[];
}) {
  const { currency } = useCurrency();
  const columns = getProductServiceColumns(currency);
  return (
    <div className="flex-2 min-w-95 bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-300 border border-gray-100 py-8 px-4">
      <h1 className="font-semibold text-xl">Products & Services</h1>
      <p className="text-gray-400">All the products & services you buy</p>
      <DataTable
        columns={columns}
        data={productService}
        searchColumn="name"
        searchPlaceholder="Search Product"
      />
    </div>
  );
}
