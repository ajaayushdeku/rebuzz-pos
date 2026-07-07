"use client";

import { Building2, Calendar } from "lucide-react";
import { mockTDSOnRentData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

const STATUS_STYLES = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Pending Remittance",
  },
  remitted: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Remitted",
  },
  overdue: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Overdue",
  },
};

export default function TDSOnRent() {
  const d = mockTDSOnRentData;
  const statusStyle = STATUS_STYLES[d.status];

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="TDS On Rent" />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Building2 size={15} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">TDS on Rent</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Track Tax Deducted at Source for rent payments
          </p>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3 space-y-4">
        {/* Monthly Rent */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700">
              Monthly Rent Payment
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Base rent before TDS deduction
            </p>
          </div>
          <p className="text-sm font-bold text-gray-900">
            Rs {d.monthlyRent.toLocaleString()}
          </p>
        </div>

        <div className="border-t border-gray-50" />

        {/* TDS to Remit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-indigo-700">
                {d.tdsRate}%
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700">TDS to Remit</p>
          </div>
          <p className="text-sm font-bold text-blue-600">
            Rs {d.tdsAmount.toLocaleString()}
          </p>
        </div>

        <div className="border-t border-gray-50" />

        {/* Due date + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar size={13} />
            <span className="text-xs">Due: {d.dueDate}</span>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}
