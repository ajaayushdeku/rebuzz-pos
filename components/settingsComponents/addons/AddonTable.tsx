"use client";

import { useState } from "react";
import type { Addon } from "@/lib/types/addons";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shapes,
  Edit3,
} from "lucide-react";

const PAGE_SIZE = 5;

const AddonTable = ({
  addons,
  search,
  onEdit,
  onDelete,
  loading = false,
}: {
  addons: Addon[];
  search: string;
  onEdit: (addon: Addon) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}) => {
  const [page, setPage] = useState(0);

  const filtered = addons.filter((addon) =>
    `${addon.name} ${addon.description ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages - 1);

  const paged = filtered.slice(
    effectivePage * PAGE_SIZE,
    (effectivePage + 1) * PAGE_SIZE,
  );

  return (
    <>
      <div className="scrollbar-hide -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <div className="min-w-[680px]">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-28" />
              <col className="w-24" />
            </colgroup>

            <thead>
              <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#9aa6bd]">
                <th className="pb-2.5 text-left font-normal">S.No.</th>
                <th className="pb-2.5 text-left font-normal">Name</th>
                <th className="pb-2.5 text-left font-normal">Price</th>
                <th className="pb-2.5 text-left font-normal">Description</th>
                <th className="pb-2.5 text-left font-normal">Max Available</th>
                <th className="pb-2.5 text-right font-normal">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-[#7b869b]">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Loading add-ons...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-2 text-center">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                        <Shapes
                          size={24}
                          className="text-gray-500 dark:text-[#9aa6bd]"
                        />
                      </div>

                      <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                        No add-ons found
                      </p>

                      <p className="mt-1 text-xs text-gray-400 dark:text-[#7b869b]">
                        Create an add-on to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((addon, idx) => (
                  <tr
                    key={addon._id}
                    className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <td className="py-3 pl-1 text-[11px] font-medium text-gray-400 dark:text-[#7b869b]">
                      #{effectivePage * PAGE_SIZE + idx + 1}
                    </td>

                    <td className="truncate py-3 pr-3 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                      {addon.name}
                    </td>

                    <td className="py-3 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                      {addon.price.toLocaleString()}
                    </td>

                    <td className="truncate py-3 pr-3 text-xs text-gray-500 dark:text-[#9aa6bd]">
                      {addon.description || "—"}
                    </td>

                    <td className="py-3 text-xs text-gray-500 dark:text-[#9aa6bd]">
                      {addon.maxAvailable ?? "—"}
                    </td>

                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(addon)}
                          aria-label={`Edit ${addon.name}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-[#7b869b] dark:hover:bg-blue-400/15 dark:hover:text-[#7ba2e3]"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(addon._id)}
                          aria-label={`Delete ${addon.name}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
          <button
            onClick={() => setPage(Math.max(0, effectivePage - 1))}
            disabled={effectivePage === 0}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
              effectivePage === 0
                ? "cursor-not-allowed text-gray-300 dark:text-[#4a5468]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span className="text-[10px] font-medium text-gray-400 dark:text-[#7b869b] sm:text-xs">
            Page {effectivePage + 1} of {totalPages} · {filtered.length} items
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, effectivePage + 1))}
            disabled={effectivePage >= totalPages - 1}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
              effectivePage >= totalPages - 1
                ? "cursor-not-allowed text-gray-300 dark:text-[#4a5468]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default AddonTable;
