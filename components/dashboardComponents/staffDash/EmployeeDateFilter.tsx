"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Default range: rolling last 30 days. */
function getDefaultRange(): DateRangeValue {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { startDate: toDateStr(start), endDate: toDateStr(today) };
}

/**
 * Client wrapper that bridges the server-rendered employee page (which reads
 * range/startDate/endDate from the URL) with the controlled DateRangeFilter.
 */
export default function EmployeeDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const value: DateRangeValue =
    startDate && endDate ? { startDate, endDate } : getDefaultRange();

  const handleChange = ({ startDate, endDate }: DateRangeValue) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("range");
    sp.set("startDate", startDate);
    sp.set("endDate", endDate);
    router.push(`?${sp.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <DateRangeFilter value={value} onChange={handleChange} showPresets />
    </div>
  );
}
