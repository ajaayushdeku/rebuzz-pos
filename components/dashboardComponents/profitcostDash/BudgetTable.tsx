"use client";

import { DataTable } from "@/components/ui/data-table";
import { BudgetItem, getBudgetColumns } from "./budget-column";
import { useCurrency } from "@/providers/CurrencyContext";

export default function BudgetTable({
  budgetData,
}: {
  budgetData: BudgetItem[];
}) {
  const { currency } = useCurrency();
  const columns = getBudgetColumns(currency);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full  overflow-hidden">
      <h1 className="font-bold md:text-xl mt-1 text-[16px]">
        Budget vs Actual
      </h1>
      <p className="text-gray-400 text-sm mt-0.5">
        Spending vs Planned Budget per Category
      </p>

      <div className=" overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mt-3">
        <DataTable columns={columns} data={budgetData} pageSize={10} />
      </div>
    </div>
  );
}
