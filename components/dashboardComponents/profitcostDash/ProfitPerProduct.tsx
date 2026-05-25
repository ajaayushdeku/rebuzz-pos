"use client";

import { DataTable } from "@/components/ui/data-table";
import {
  getProfitPerProductColumns,
  Product,
} from "./profit-per-product-column";
import { useCurrency } from "@/providers/CurrencyContext";

export default function ProfitPerProduct({
  products,
}: {
  products: Product[];
}) {
  const { currency } = useCurrency();
  const columns = getProfitPerProductColumns(currency);
  return (
    // <div className="flex-2 min-w-95 bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-300 border border-gray-100 py-8 px-4">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <div className="min-w-0">
        <h1 className="font-bold mt-1 md:text-xl text-[16px] text-gray-900">
          Profit per Product
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Revenue, cost and margins for top selling products .
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <DataTable
          columns={columns}
          data={products}
          searchColumn="name"
          searchPlaceholder="Search products..."
          pageSize={5}
        />
      </div>
    </div>
  );
}
