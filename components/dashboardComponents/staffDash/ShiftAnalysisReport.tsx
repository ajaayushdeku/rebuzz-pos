"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

export type Shift = {
  label: string;
  orders: number;
  // avgTime: number;
  revenue: number;
  staff: number;
};

type ShiftAnalysisReportProps = {
  title?: string;
  description?: string;
  shifts: Shift[];
};

export default function ShiftAnalysisReport({
  title = "Shift Analysis Report",
  description = "Performance comparison across morning, afternoon, and evening",
  shifts,
}: ShiftAnalysisReportProps) {
  const { currency } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition duration-300 p-4 md:p-6 w-full mt-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Shift</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Orders</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Revenue
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Staff</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No shift data available
                </td>
              </tr>
            ) : (
              shifts.map((shift, idx) => (
                <tr
                  key={shift.label}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {shift.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-800">
                      {shift.orders}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-green-600">
                    {/* {formatCurrency(shift.revenue as number, currency)} */}
                    {formatCurrencySymbol(
                      shift.revenue as number,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {shift.staff}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
