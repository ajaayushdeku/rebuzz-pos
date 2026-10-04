"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  /**
   * Names the control for screen readers. Needed where the field's caption
   * is not a `<label>` — a `<label htmlFor>` cannot point at a button.
   */
  ariaLabel?: string;
  /** Unpickable and visibly so: nothing to choose from, or a save in flight. */
  disabled?: boolean;
  /**
   * Leave the labels exactly as given.
   *
   * The default capitalises, which suits the filter words these started with
   * ("paid", "all status"). It is wrong for anything that is an identifier
   * rather than a word — a model id like `gemini-3.6-flash` must not be shown
   * as `Gemini-3.6-flash`, because that is not what it is called.
   */
  preserveCase?: boolean;
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
  ariaLabel,
  disabled = false,
  preserveCase = false,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  /** Capitalising is the default; an identifier opts out. */
  const caseClass = preserveCase ? "" : "capitalize";

  /**
   * Derived, not synced: becoming disabled closes the panel by definition.
   *
   * An effect that called setOpen(false) would leave one frame where a disabled
   * control still showed an open panel, and nothing in it able to close.
   */
  const isOpen = open && !disabled;

  /**
   * Open a long list at the current value rather than at the top.
   *
   * Only when the panel actually overflows, and only its own scrollTop — a
   * plain `scrollIntoView` on a panel that fits would scroll the page instead,
   * which is how a dropdown ends up yanking the view on open.
   */
  useLayoutEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    const item = selectedRef.current;
    if (!panel || !item || panel.scrollHeight <= panel.clientHeight) return;
    item.scrollIntoView({ block: "nearest" });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      // Escape is handled here rather than on the document so it stops at the
      // wrapper — otherwise it would also close the Dialog this usually sits in.
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc]",
          caseClass,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 dark:text-[#7b869b] ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* max-h + scroll engages only once a list outgrows it, so the short
          filter lists this started with are unchanged; overscroll-contain stops
          the page scrolling on from the end of a long one. */}
      <div
        ref={panelRef}
        role="listbox"
        className={`absolute z-30 mt-1.5 max-h-72 w-full origin-top overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 dark:border-white/15 dark:bg-[#1b2436] ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            ref={value === opt.value ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={value === opt.value}
            disabled={opt.disabled}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors ${caseClass} ${
              opt.disabled
                ? "cursor-not-allowed text-gray-400 dark:text-[#6b7588]"
                : value === opt.value
                  ? "cursor-pointer bg-blue-50 text-blue-700 font-medium dark:bg-blue-400/15 dark:text-[#a8c4ee]"
                  : "cursor-pointer text-gray-600 hover:bg-gray-100 dark:text-[#c3ccdc] dark:hover:bg-white/10"
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
