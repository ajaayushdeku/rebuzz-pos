"use client";

import { CalendarDays } from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ExpenseMonthYearFilter() {
  const { month, year, setMonth, setYear } = useTracker();

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
      {/* Month */}
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="h-8.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      >
        {MONTHS.map((name, idx) => (
          <option key={idx + 1} value={idx + 1}>
            {name}
          </option>
        ))}
      </select>
      {/* Year */}
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="h-8.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
