"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

/**
 * The month/year control used by dashboard cards that scope themselves to a
 * calendar month rather than the page's global range.
 *
 * Lifted out of RevenueFlowSankey so break-even could reuse it. A second copy
 * would have drifted — the two controls sit on the same page, and users read
 * matching controls as behaving identically.
 */

export const MONTHS = [
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

interface Option {
  value: number;
  label: string;
}

export function FilterDropdown({
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

/** Calendar icon plus the month and year dropdowns, as one control. */
export function MonthYearFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
  yearsBack = 5,
  yearsForward = 1,
}: {
  month: number;
  year: number;
  onMonthChange: (v: number) => void;
  onYearChange: (v: number) => void;
  yearsBack?: number;
  yearsForward?: number;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: yearsBack + yearsForward + 1 },
    (_, i) => currentYear - yearsBack + i,
  );

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
      <FilterDropdown
        value={month}
        options={MONTHS.map((name, idx) => ({ value: idx + 1, label: name }))}
        onChange={onMonthChange}
        widthClass="w-[120px]"
      />
      <FilterDropdown
        value={year}
        options={years.map((y) => ({ value: y, label: String(y) }))}
        onChange={onYearChange}
        widthClass="w-[90px]"
      />
    </div>
  );
}
