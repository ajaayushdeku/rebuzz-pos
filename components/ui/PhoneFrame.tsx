"use client";

import type { ReactNode } from "react";
import { BatteryMedium, SignalHigh, Wifi } from "lucide-react";

/**
 * The frame a document preview sits in, in either of its two states.
 *
 * One element rather than a phone and a sheet swapped for each other: a swap
 * cannot be animated, and the whole point of the Desktop/Mobile toggle is
 * watching the page narrow into a handset. So the bezel, the radius and the
 * width are all transitioned, and the status bar and home indicator collapse
 * to nothing rather than unmounting.
 */
export default function PhoneFrame({
  active,
  width,
  children,
  className = "",
}: {
  /** True for the phone; false for the plain document sheet. */
  active: boolean;
  /** Outer width in px, borders included. */
  width: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{
        width,
        borderRadius: active ? "2rem" : "0.25rem",
        borderWidth: active ? 6 : 1,
        borderColor: active ? "#111827" : "#e5e7eb",
      }}
      className={`shrink-0 overflow-hidden border-solid bg-white shadow-lg transition-all duration-500 ease-in-out ${className}`}
    >
      {/* Height and opacity, not mounting: a status bar that popped in at the
          end of the transition would break the illusion it is part of. */}
      <div
        aria-hidden={!active}
        className={`relative flex items-center justify-between overflow-hidden bg-white px-5 text-[11px] font-semibold text-gray-900 transition-all duration-500 ease-in-out ${
          active ? "h-8 opacity-100" : "h-0 opacity-0"
        }`}
      >
        <span className="tabular-nums">9:41</span>
        <span className="absolute left-1/2 top-1 h-4 w-16 -translate-x-1/2 rounded-full bg-gray-900" />
        <span className="flex items-center gap-1 text-gray-800">
          <SignalHigh size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={15} strokeWidth={2} />
        </span>
      </div>

      {children}

      <div
        aria-hidden
        className={`overflow-hidden bg-white transition-all duration-500 ease-in-out ${
          active ? "h-5 opacity-100" : "h-0 opacity-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}
