import { useState } from "react";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Layers,
} from "lucide-react";

const PAGE_SIZE = 5;

const GroupTaxTable = ({
  groupedTaxes,
  taxes,
  search,
  onToggle,
  onDelete,
  togglingId,
  loading = false,
}: {
  groupedTaxes: GroupedTax[];
  taxes: Tax[];
  search: string;
  onToggle: (id: string, currentlyEnabled: boolean) => void;
  onDelete: (group: GroupedTax) => void;
  togglingId: string | null;
  loading?: boolean;
}) => {
  const [page, setPage] = useState(0);

  const getGroupRate = (taxIds: string[]) =>
    taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  const filtered = groupedTaxes.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
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
      <div className="scrollbar-hide overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <div className="min-w-[680px]">
          {/* The same grid the standard table declares, so the two line up
              when the tab is switched; "Includes" takes the flexible track. */}
          <table className="w-full table-fixed text-sm min-w-[990px]">
            <colgroup>
              <col className="w-14" />
              <col className="w-64" />
              <col className="w-40" />
              <col />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#9aa6bd]">
                <th className="text-left pb-2.5 pr-1 font-normal">S.No.</th>
                <th className="text-left pb-2.5 font-normal">Name</th>
                <th className="text-left pb-2.5 font-normal">Combined Rate</th>
                <th className="text-left pb-2.5 font-normal">Includes</th>
                <th className="text-center pb-2.5 font-normal">Status</th>
                <th className="text-center pb-2.5 font-normal">Applied</th>
                <th className="text-right pb-2.5 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-[#7b869b]">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Loading group taxes...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-2 text-sm text-gray-400 dark:text-[#7b869b]"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-white/10">
                        <Layers
                          size={24}
                          className="text-gray-500 dark:text-[#9aa6bd]"
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                        No group taxes yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1 dark:text-[#7b869b]">
                        Combine standard taxes to create one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((group, idx) => {
                  const rate = getGroupRate(group.taxIds);
                  const names = group.taxIds
                    .map((id) => taxes.find((t) => t._id === id)?.name ?? "")
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr
                      key={group._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <td className="py-3 pr-1 font-medium text-[11px] text-gray-400 dark:text-[#7b869b]">
                        #{idx + 1}
                      </td>
                      <td
                        className="truncate py-3 pr-3 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]"
                        title={group.name}
                      >
                        {group.name}
                      </td>
                      <td className="whitespace-nowrap py-3 text-xs font-semibold tabular-nums text-blue-600 dark:text-[#7ba2e3]">
                        {rate}%
                      </td>
                      <td
                        className="py-3 pr-3 text-xs break-words whitespace-normal text-[#3c4043] dark:text-[#c3ccdc]"
                        title={names || undefined}
                      >
                        {names || "—"}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.isEnabled ? "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-[#9aa6bd]"}`}
                        >
                          {group.isEnabled ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {/* Its own column: turning a group on or off is a state
                          the row carries, not one of its menu actions. */}
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggle(group._id, group.isEnabled)}
                          role="switch"
                          aria-checked={group.isEnabled}
                          aria-label={`${group.isEnabled ? "Disable" : "Enable"} ${group.name}`}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${group.isEnabled ? "bg-blue-600" : "bg-[#dadce0] dark:bg-white/25"}`}
                        >
                          {togglingId === group._id ? (
                            <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
                          ) : (
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${group.isEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`}
                            />
                          )}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onDelete(group)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
                          >
                            {/* <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg> */}
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
          <button
            onClick={() => setPage(Math.max(0, effectivePage - 1))}
            disabled={effectivePage === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectivePage === 0
                ? "text-gray-300 cursor-not-allowed dark:text-[#4a5468]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <span className="text-xs text-gray-400 font-medium dark:text-[#7b869b]">
            Page {effectivePage + 1} of {totalPages} · {filtered.length} groups
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, effectivePage + 1))}
            disabled={effectivePage >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectivePage >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed dark:text-[#4a5468]"
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

export default GroupTaxTable;
