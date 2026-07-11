"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

// Collapsible, numbered builder section — matches the campaign-builder accordion.
export default function OfferSection({
  title,
  summary,
  complete = false,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  complete?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        {/* Status dot */}
        {complete ? (
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Check size={12} className="text-white" />
          </span>
        ) : (
          <span
            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
              open ? "border-blue-600" : "border-gray-300"
            }`}
          >
            {open && <span className="w-2 h-2 rounded-full bg-blue-600" />}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {!open && summary && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{summary}</p>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
