"use client";

import { DataTable } from "@/components/ui/data-table";
import { getRefundReasonColumns, RefundReason } from "./refund-analysis-column";
import { useCurrency } from "@/providers/CurrencyContext";

export default function RefundAnalysis({
  refundReasons,
}: {
  refundReasons: RefundReason[];
}) {
  const { currency } = useCurrency();
  const columns = getRefundReasonColumns(currency);
  return (
    // <div className="flex-2 min-w-95 bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-300 border border-gray-100 py-8 px-4">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <h1 className="font-bold md:text-xl text-[16px]">Refund Analysis</h1>
      <p className="text-gray-400 text-sm mt-0.5">
        Primary reasons for customer refunds this period .
      </p>

      <div className="mt-2 md:mt-12 overflow-x-auto">
        <DataTable columns={columns} data={refundReasons} pageSize={5} />
      </div>
    </div>
  );
}
