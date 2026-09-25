"use client";

import { useState } from "react";
import type { Category } from "@/lib/types/category";
import { normalizeColor } from "@/services/category.client";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tags,
  Edit3,
} from "lucide-react";
import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";

const PAGE_SIZE = 5;

const CategoryTable = ({
  categories,
  search,
  onEdit,
  onDelete,
  loading = false,
}: {
  categories: Category[];
  search: string;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}) => {
  const [page, setPage] = useState(0);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage =
    page >= totalPages && totalPages > 0 ? totalPages - 1 : page;
  const paged = filtered.slice(
    effectivePage * PAGE_SIZE,
    (effectivePage + 1) * PAGE_SIZE,
  );

  return (
    <>
      {/* `table-fixed` with declared widths: auto layout sized the columns
          from whatever categories were on the page, so searching or paging
          moved them. Name takes the slack. */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-42" />
          <col className="w-24" />
        </colgroup>
        <thead>
          <tr
            className="border-b text-[11px] tracking-wider"
            style={{
              borderColor: CHART_PALETTE.grid,
              color: CHART_PALETTE.axis,
            }}
          >
            <th className="text-left pb-2.5 font-normal">S.No.</th>
            <th className="text-left pb-2.5 font-normal">Name</th>
            <th className="text-left pb-2.5 font-normal">Color</th>
            <th className="text-right pb-2.5 font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-10 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm">Loading categories...</span>
                </div>
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="text-center py-2 text-sm text-gray-400"
              >
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Tags size={24} className="text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    No categories found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a category to get started.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paged.map((c, idx) => (
              <tr
                key={c._id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3 font-medium text-[11px] text-gray-400">
                  #{idx + 1}
                </td>
                <td
                  className="truncate py-3 pr-3 text-[13px] font-medium"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {c.name}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md border border-gray-200 shrink-0"
                      style={{ backgroundColor: normalizeColor(c.color) }}
                    />
                    <span className="text-xs text-gray-500 font-mono">
                      {normalizeColor(c.color)}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(c)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(c._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage(Math.max(0, effectivePage - 1))}
            disabled={effectivePage === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectivePage === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span className="text-xs text-gray-400 font-medium">
            Page {effectivePage + 1} of {totalPages} · {filtered.length} items
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, effectivePage + 1))}
            disabled={effectivePage >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectivePage >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

export default CategoryTable;
