import { useState } from "react";
import { Tax } from "@/services/apiTaxes.client";
import {
  Edit3,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";

const PAGE_SIZE = 5;

const StandardTaxTable = ({
  taxes,
  search,
  onEdit,
  onToggle,
  onDelete,
  togglingId,
  loading = false,
}: {
  taxes: Tax[];
  search: string;
  onEdit: (tax: Tax) => void;
  onToggle: (id: string, currentlyEnabled: boolean) => void;
  onDelete: (tax: Tax) => void;
  togglingId: string | null;
  loading?: boolean;
}) => {
  const [page, setPage] = useState(0);

  const filtered = taxes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
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
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <div className="min-w-[680px]">
          {/* `table-fixed` with declared widths: auto layout sized each tab's
              columns from its own content, so switching tabs moved them. The
              empty fourth track matches the group table's "Includes" column,
              which is what keeps the two grids aligned. */}
          <table className="w-full table-fixed text-sm">
            {/* Same widths as the group table, "Combined Rate" included, so
                the shared columns do not move when the tab is switched. */}
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
              <tr
                className="border-b text-[11px] tracking-wider"
                style={{
                  borderColor: CHART_PALETTE.grid,
                  color: CHART_PALETTE.axis,
                }}
              >
                <th className="text-left pb-2.5 font-normal">S.No.</th>
                <th className="text-left pb-2.5 font-normal">Name</th>
                <th className="text-left pb-2.5 font-normal">Rate</th>
                <th aria-hidden />
                <th className="text-center pb-2.5 font-normal">Status</th>
                <th className="text-center pb-2.5 font-normal">Applied</th>
                <th className="text-right pb-2.5 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Loading taxes...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-2 text-sm text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Receipt size={24} className="text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        No taxes yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create one above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((tax, idx) => (
                  <tr
                    key={tax._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 font-medium text-[11px] text-gray-400">
                      #{idx + 1}
                    </td>
                    <td
                      className="truncate py-3 pr-3 text-[13px] font-medium"
                      style={{ color: CHART_PALETTE.title }}
                      title={tax.name}
                    >
                      {tax.name}
                    </td>
                    <td className="whitespace-nowrap py-3 text-xs font-semibold tabular-nums text-blue-600">
                      {tax.rate}%
                    </td>
                    <td aria-hidden />
                    <td className="py-3 text-xs text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${tax.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} `}
                      >
                        {tax.isEnabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Its own column: turning a tax on or off is a state the
                        row carries, not one of the row's menu actions. */}
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(tax._id, tax.isEnabled)}
                        role="switch"
                        aria-checked={tax.isEnabled}
                        aria-label={`${tax.isEnabled ? "Disable" : "Enable"} ${tax.name}`}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${tax.isEnabled ? "bg-blue-600" : "bg-[#dadce0]"}`}
                      >
                        {togglingId === tax._id ? (
                          <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
                        ) : (
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${tax.isEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`}
                          />
                        )}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(tax)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(tax)}
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
            Page {effectivePage + 1} of {totalPages} · {filtered.length} taxes
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

export default StandardTaxTable;
