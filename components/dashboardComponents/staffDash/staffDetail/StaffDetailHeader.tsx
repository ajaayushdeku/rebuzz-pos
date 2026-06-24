"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";

interface StaffDetailHeaderProps {
  employeeId: string;
  name: string;
  dateRange: DateRangeValue;
  onDateRangeChange: (range: DateRangeValue) => void;
}

export default function StaffDetailHeader({
  employeeId,
  name,
  dateRange,
  onDateRangeChange,
}: StaffDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/employee")}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {name?.charAt(0)?.toUpperCase() ?? "S"}
          </div> */}
          <div>
            <h1 className="font-bold text-xl md:text-2xl text-gray-900">
              {name ?? "Staff"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Employee ID: {employeeId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
