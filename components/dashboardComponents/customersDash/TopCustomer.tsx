"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { getTopCustomerColumns } from "./top-customer-column";
import { TopCustomersProps } from "./top-customer-column";
import { DataTable } from "@/components/ui/data-table";

export default function TopCustomer({ topCustomers }: TopCustomersProps) {
  const { currency } = useCurrency();
  const columns = getTopCustomerColumns(currency);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <h1 className="font-bold text-[16px] md:text-xl">
        Top Customers & Loyalty Points
      </h1>
      <p className="text-gray-400 text-sm mt-0.5">
        Highest value contributors this month
      </p>

      <div className="mt-3 overflow-x-auto">
        <DataTable
          columns={columns}
          data={topCustomers}
          searchColumn="customer"
          searchPlaceholder="Search customer..."
          pageSize={10}
          filters={[
            {
              columnId: "loyaltyTier",
              label: "Tier",
              options: ["Gold", "Silver", "Bronze", "None"],
            },
          ]}
        />
      </div>
    </div>
  );
}
