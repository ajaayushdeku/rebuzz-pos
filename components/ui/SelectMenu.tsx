// "use client";

// import { useEffect, useRef, useState } from "react";
// import { ChevronDown } from "lucide-react";

// export type SelectMenuOption<T extends string = string> = {
//   value: T;
//   label: string;
// };

// interface SelectMenuProps<T extends string = string> {
//   value: T;
//   options: SelectMenuOption<T>[];
//   onChange: (value: T) => void;
//   /** Shown when the current value isn't in `options`. */
//   placeholder?: string;
//   /** Width utilities for the wrapper, e.g. "w-full sm:w-[150px]". */
//   className?: string;
//   /** Title-cases option text. On by default — matches the status filter. */
//   capitalize?: boolean;
//   disabled?: boolean;
//   "aria-label"?: string;
// }

// /**
//  * The app's standard dropdown — the one the invoice status filter uses.
//  *
//  * The panel stays mounted and is hidden with opacity/scale/pointer-events
//  * rather than unmounted, which is what makes it animate both ways; a panel
//  * that unmounts on close can only animate in. The trade-off is that its
//  * buttons are still in the tab order while hidden, so they're explicitly
//  * made inert below.
//  */
// export default function SelectMenu<T extends string = string>({
//   value,
//   options,
//   onChange,
//   placeholder = "Select...",
//   className = "w-full sm:w-[150px]",
//   capitalize = true,
//   disabled = false,
//   "aria-label": ariaLabel,
// }: SelectMenuProps<T>) {
//   const [open, setOpen] = useState(false);
//   const wrapperRef = useRef<HTMLDivElement | null>(null);
//   const triggerRef = useRef<HTMLButtonElement | null>(null);

//   const selected = options.find((o) => o.value === value);

//   // Close on outside click / Escape. Escape also returns focus to the
//   // trigger, so keyboard users don't get dropped back to the top of the page.
//   useEffect(() => {
//     if (!open) return;

//     const onClickOutside = (e: MouseEvent) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(e.target as Node)
//       ) {
//         setOpen(false);
//       }
//     };
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setOpen(false);
//         triggerRef.current?.focus();
//       }
//     };

//     document.addEventListener("mousedown", onClickOutside);
//     document.addEventListener("keydown", onKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", onClickOutside);
//       document.removeEventListener("keydown", onKeyDown);
//     };
//   }, [open]);

//   return (
//     <div ref={wrapperRef} className={` ${className}`}>
//       <button
//         ref={triggerRef}
//         type="button"
//         disabled={disabled}
//         aria-haspopup="listbox"
//         aria-expanded={open}
//         aria-label={ariaLabel}
//         onClick={() => setOpen((o) => !o)}
//         className={`w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50 ${
//           capitalize ? "capitalize" : ""
//         }`}
//       >
//         <span className="truncate">{selected?.label ?? placeholder}</span>
//         <ChevronDown
//           size={14}
//           className={`shrink-0 text-gray-400 transition-transform duration-200 ${
//             open ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       <div
//         role="listbox"
//         aria-label={ariaLabel}
//         // Hidden panels keep their buttons in the tab order — inert takes
//         // them out without unmounting and losing the close animation.
//         inert={!open}
//         className={`absolute z-30 mt-1.5 origin-top rounded-xl border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
//           open
//             ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
//             : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
//         }`}
//       >
//         {options.map((opt) => (
//           <button
//             key={opt.value}
//             type="button"
//             role="option"
//             aria-selected={value === opt.value}
//             onClick={() => {
//               onChange(opt.value);
//               setOpen(false);
//             }}
//             className={`w-full text-left px-3 py-1.5 text-[13px] rounded-lg transition-colors cursor-pointer ${
//               capitalize ? "capitalize" : ""
//             } ${
//               value === opt.value
//                 ? "bg-blue-50 text-blue-700 font-medium"
//                 : "text-gray-600 hover:bg-gray-100"
//             }`}
//           >
//             {opt.label}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type SelectMenuOption<T extends string = string> = {
  value: T;
  label: string;
};

interface SelectMenuProps<T extends string = string> {
  value: T;
  options: SelectMenuOption<T>[];
  onChange: (value: T) => void;
  /** Shown when the current value isn't in `options`. */
  placeholder?: string;
  /** Width utilities for the wrapper, e.g. "w-full sm:w-[150px]". */
  className?: string;
  /**
   * Overrides the trigger's height, radius and border so the dropdown can
   * match a form's existing controls. Only the SHAPE classes are replaced —
   * padding, type scale and focus ring stay put, so every instance still
   * reads as the same component. Tailwind resolves conflicting utilities by
   * stylesheet order, not class order, which is why these are swapped rather
   * than appended.
   */
  triggerClassName?: string;
  /** Title-cases option text. On by default — matches the status filter. */
  capitalize?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

/** Space to leave between the panel and the viewport edge when flipping. */
const VIEWPORT_MARGIN = 8;

/**
 * The app's standard dropdown — the one the invoice status filter uses.
 *
 * The panel is PORTALED to <body> and positioned fixed against the trigger's
 * rect. Rendering it as a normal absolute child looks fine in a plain page,
 * but inside any `overflow-y-auto` ancestor — ModalShell's scroll area, the
 * invoice table's scroll wrapper — the panel is clipped at that ancestor's
 * bounds, so it disappears behind whatever sits below (a modal footer, for
 * instance). z-index can't fix that; only escaping the container can.
 */
export default function SelectMenu<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "w-full sm:w-[150px]",
  triggerClassName,
  capitalize = true,
  disabled = false,
  "aria-label": ariaLabel,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    dropUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  /** Anchor the panel under (or over) the trigger, in viewport coordinates. */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Flip above the trigger only when there genuinely isn't room below AND
    // there's more room above — otherwise a near-bottom menu flips for no gain.
    const dropUp =
      spaceBelow < panelHeight + VIEWPORT_MARGIN && rect.top > spaceBelow;

    setPosition({
      top: dropUp ? rect.top - panelHeight - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      dropUp,
    });
  }, []);

  // Measure before paint so the panel never renders at a stale position.
  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  // Follow the trigger while open. `true` captures scrolls on ANY ancestor,
  // not just the window — the trigger may live in a scrolling modal or table.
  useEffect(() => {
    if (!open) return;

    const onReflow = () => updatePosition();
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, updatePosition]);

  // Close on outside click / Escape. The panel is portaled, so "outside"
  // has to exclude both the trigger and the panel.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    // Capture phase so Escape closes the menu without also closing the
    // modal the menu might be sitting inside.
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const panel = (
    <div
      ref={panelRef}
      role="listbox"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
      }}
      // Above ModalShell's overlay (z-50) so it works inside modals too.
      className={`z-[60] rounded-xl border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
        position.dropUp ? "origin-bottom" : "origin-top"
      } ${
        open
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : `opacity-0 scale-95 pointer-events-none ${
              position.dropUp ? "translate-y-1" : "-translate-y-1"
            }`
      }`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={value === opt.value}
          tabIndex={open ? 0 : -1}
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
            triggerRef.current?.focus();
          }}
          className={`w-full text-left px-3 py-1.5 text-[13px] rounded-lg transition-colors cursor-pointer ${
            capitalize ? "capitalize" : ""
          } ${
            value === opt.value
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50 ${
          triggerClassName ?? "py-2.5 border border-gray-200 rounded-xl"
        } ${capitalize ? "capitalize" : ""}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Kept mounted so the close animation can play; inert while hidden. */}
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
