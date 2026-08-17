"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterSelectOption {
  value: string;
  label: string;
  /**
   * Shown in the trigger when active, but not pickable — the native `<option
   * disabled>` behaviour the hour-range filters use for their "Custom" entry,
   * which is only ever reached by editing the from/to inputs.
   */
  disabled?: boolean;
}

interface FilterSelectProps {
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Applied to the wrapper, so callers control width. */
  className?: string;
}

/**
 * The dropdown from InvoiceTable's "All Status" filter, lifted into a reusable
 * component: a plain button plus an absolutely-positioned panel that scales in.
 *
 * Deliberately not a Radix Select. It renders inline rather than through a
 * portal, which keeps it usable inside a Dialog without a second portal layer
 * fighting the first for Escape and focus.
 */
export function FilterSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  className,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      // Escape is handled here rather than on the document so it stops at the
      // wrapper — otherwise it would also close the Dialog this usually sits in.
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition capitalize"
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="listbox"
        className={`absolute z-30 mt-1.5 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={value === opt.value}
            disabled={opt.disabled}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors capitalize ${
              opt.disabled
                ? "cursor-not-allowed text-gray-400"
                : value === opt.value
                  ? "cursor-pointer bg-blue-50 text-blue-700 font-medium"
                  : "cursor-pointer text-gray-600 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterSelect;
