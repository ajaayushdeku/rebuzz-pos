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
  buttonClassName?: string;
  menuClassName?: string;
  /**
   * Names the control for screen readers. Needed where the field's caption
   * is not a `<label>` — a `<label htmlFor>` cannot point at a button.
   */
  ariaLabel?: string;
  /** Unpickable and visibly so: nothing to choose from, or a save in flight. */
  disabled?: boolean;

  preserveCase?: boolean;
}

export function FilterSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  className,
  buttonClassName = "pl-3 pr-2.5 py-2.5 text-[13px] ",
  menuClassName = "w-full",
  ariaLabel,
  disabled = false,
  preserveCase = false,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuSide, setMenuSide] = useState<"left" | "right">("left");

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
   * Which side the panel hangs from, and where a long list starts.
   *
   * In a layout effect so it is settled before the browser paints: measured
   * after paint, the panel would be visible on the wrong side for a frame and
   * jump across as it opened.
   *
   * Re-run on resize while open, because a phone rotating mid-choice changes the
   * answer, and the panel is the one thing on screen that would then be in the
   * wrong place.
   */
  useLayoutEffect(() => {
    if (!isOpen) return;

    const place = () => {
      const wrapper = ref.current;
      const panel = panelRef.current;
      if (!wrapper || !panel) return;

      const wrapperRect = wrapper.getBoundingClientRect();

      // Room either side of the trigger, and what the panel wants.
      const spaceRight = window.innerWidth - wrapperRect.left;
      const spaceLeft = wrapperRect.right;
      const menuWidth = panel.offsetWidth;

      // Flipped only when it genuinely does not fit on the right *and* does fit
      // on the left; otherwise left, which keeps the usual alignment.
      setMenuSide(spaceRight < menuWidth && spaceLeft >= menuWidth ? "right" : "left");
    };

    place();

    // Keep the selected item visible for long lists — its own scrollTop only, so
    // a panel that fits cannot scroll the page instead.
    const panel = panelRef.current;
    const item = selectedRef.current;
    if (panel && item && panel.scrollHeight > panel.clientHeight) {
      item.scrollIntoView({ block: "nearest" });
    }

    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
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
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc]",
          caseClass,
          buttonClassName,
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

      {/*
        Mounted only while open, which is the fix for a panel that was taking up
        room before it had ever been used.

        It used to stay in the DOM at `opacity-0`. That hides it but changes
        nothing about layout: a 182px panel on a 100px trigger still hung 63px
        past the right edge of a phone screen, widening whatever could scroll and
        covering what sat beside it. Worse, the side was only chosen when the
        panel first opened — so the overhang was there on every fresh page load
        and vanished at the first press, which is exactly how it was reported.

        Unmounting also means the side is measured at the moment it is needed,
        against the space the trigger has right then.

        max-h + scroll engages only once a list outgrows it, so the short filter
        lists this started with are unchanged; overscroll-contain stops the page
        scrolling on from the end of a long one. max-w keeps the panel inside the
        window on a narrow screen whatever width a caller asked for.
      */}
      {isOpen && (
        <div
          ref={panelRef}
          role="listbox"
          className={cn(
            "absolute z-30 mt-1.5 max-h-72 max-w-[calc(100vw-1rem)] origin-top overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 dark:border-white/15 dark:bg-[#1b2436]",
            menuClassName,
            menuSide === "left" ? "left-0" : "right-0",
          )}
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
      )}
    </div>
  );
}

export default FilterSelect;
