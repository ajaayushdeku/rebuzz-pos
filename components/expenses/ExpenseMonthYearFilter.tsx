"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
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

type Option = { value: number; label: string };

/** Reusable animated dropdown used for the month & year filters. */
function FilterDropdown({
  value,
  options,
  onChange,
  widthClass = "w-[110px]",
}: {
  value: number;
  options: Option[];
  onChange: (v: number) => void;
  widthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition"
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute z-30 mt-1 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
              value === opt.value
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExpenseMonthYearFilter() {
  const { month, year, setMonth, setYear } = useTracker();

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
      {/* Month */}
      <FilterDropdown
        value={month}
        options={MONTHS.map((name, idx) => ({ value: idx + 1, label: name }))}
        onChange={setMonth}
        widthClass="w-[120px]"
      />
      {/* Year */}
      <FilterDropdown
        value={year}
        options={years.map((y) => ({ value: y, label: String(y) }))}
        onChange={setYear}
        widthClass="w-[90px]"
      />
    </div>
  );
}
