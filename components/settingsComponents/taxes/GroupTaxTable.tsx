import { useState } from "react";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import { Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const PAGE_SIZE = 5;

const GroupTaxTable = ({
  groupedTaxes,
  taxes,
  search,
  onToggle,
  onDelete,
  togglingId,
}: {
  groupedTaxes: GroupedTax[];
  taxes: Tax[];
  search: string;
  onToggle: (id: string, currentlyEnabled: boolean) => void;
  onDelete: (group: GroupedTax) => void;
  togglingId: string | null;
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

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No group taxes yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <div className="min-w-[600px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2.5 font-medium">Name</th>
                <th className="text-left pb-2.5 font-medium">Combined Rate</th>
                <th className="text-left pb-2.5 font-medium">Includes</th>
                <th className="text-center pb-2.5 font-medium">Status</th>
                <th className="text-right pb-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((group) => {
                const rate = getGroupRate(group.taxIds);
                const names = group.taxIds
                  .map((id) => taxes.find((t) => t._id === id)?.name ?? "")
                  .filter(Boolean)
                  .join(", ");
                return (
                  <tr
                    key={group._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 font-medium text-gray-800">
                      {group.name}
                    </td>
                    <td className="py-3 text-blue-600 font-semibold">
                      {rate}%
                    </td>
                    <td className="py-3 text-gray-400 text-xs whitespace-normal break-words">
                      {names || "—"}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {group.isEnabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onToggle(group._id, group.isEnabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${group.isEnabled ? "bg-blue-600" : "bg-gray-200"}`}
                        >
                          {togglingId === group._id ? (
                            <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
                          ) : (
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${group.isEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`}
                            />
                          )}
                        </button>
                        <button
                          onClick={() => onDelete(group)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              })}
            </tbody>
          </table>
        </div>
      </div>

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
            Page {effectivePage + 1} of {totalPages} · {filtered.length} groups
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

export default GroupTaxTable;
