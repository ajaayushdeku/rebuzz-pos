"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Previous / page-count / Next, for paged lists and tables.
 *
 * Extracted from ShiftsSection, which had the only copy — the shifts table,
 * the top-items list and several others were each about to grow their own.
 * `noun` keeps the middle label specific ("12 shifts", "23 items").
 */
export default function TablePagination({
  page,
  totalPages,
  total,
  noun,
  onPageChange,
}: {
  /** Zero-based. */
  page: number;
  totalPages: number;
  total: number;
  /** Plural noun for the count, e.g. "shifts". */
  noun: string;
  onPageChange: (page: number) => void;
}) {
  const atStart = page === 0;
  const atEnd = page >= totalPages - 1;

  const buttonClass = (disabled: boolean) =>
    `flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${
      disabled
        ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:text-[#a9b4c7]"
    }`;

  return (
    <div className="mt-4 flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10 pt-3">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={atStart}
        className={buttonClass(atStart)}
      >
        <ChevronLeft size={14} />
        Previous
      </button>

      <span className="text-[10px] sm:text-xs font-medium tabular-nums text-gray-400">
        Page {page + 1} of {totalPages} · {total} {noun}
      </span>

      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={atEnd}
        className={buttonClass(atEnd)}
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
