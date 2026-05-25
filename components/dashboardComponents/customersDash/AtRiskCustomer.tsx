import { TriangleAlert } from "lucide-react";

import { columns } from "./atrisk-customer-column";
import { DataTable } from "@/components/ui/data-table";

type SpendingLevel = "High" | "Medium" | "Low";

export type AtRiskCustomer = {
  rank: number;
  name: string;
  lastVisit: number;
  spendLevel: SpendingLevel;
};

type AtRiskCustomersProps = {
  riskCustomers: AtRiskCustomer[];
};

export default function AtRiskCustomer({
  riskCustomers,
}: AtRiskCustomersProps) {
  const numCustomers = riskCustomers.length;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-bold text-[16px] mt-1 md:text-xl text-gray-900">
            At-Risk Customers
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Inactive customers who need re-engagement
          </p>
        </div>
        <div className="text-yellow-600 border-yellow-500 border bg-yellow-100 flex items-center rounded-2xl px-2 py-0.5 gap-1 shrink-0">
          <TriangleAlert size={11} className="shrink-0" />
          <p className="text-[10px] md:text-[12px] font-semibold whitespace-nowrap">
            {numCustomers} at risk
          </p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <DataTable
          columns={columns}
          data={riskCustomers}
          searchColumn="name"
          searchPlaceholder="Search customer..."
          pageSize={10}
          filters={[
            {
              columnId: "spendLevel",
              label: "Spending Level",
              options: ["High", "Medium", "Low"],
            },
          ]}
        />
      </div>
    </div>
  );
}
