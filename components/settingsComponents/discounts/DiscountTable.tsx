import { useState } from "react";
import { Discount } from "@/app/(app)/settings/discount/page";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const PAGE_SIZE = 5;

const DiscountTable = ({
  discounts,
  search,
  onEdit,
  onDelete,
}: {
  discounts: Discount[];
  search: string;
  onEdit: (d: Discount) => void;
  onDelete: (id: string) => void;
}) => {
  const { currency } = useCurrency();
  const [page, setPage] = useState(0);

  const filtered = discounts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
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
        No discounts found
      </div>
    );
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-gray-100">
            <th className="text-left pb-2.5 font-medium">Name</th>
            <th className="text-left pb-2.5 font-medium">Value</th>
            <th className="text-right pb-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((d) => (
            <tr
              key={d._id}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-3 font-medium text-xs text-gray-800">
                {d.name}
              </td>
              <td className="py-3 text-xs text-gray-600">
                {d.type === "percentage"
                  ? `${d.rate}%`
                  : ` ${formatCurrencySymbol(d.rate, currency.symbol, currency.locale)}`}
              </td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(d)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(d._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
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

export default DiscountTable;
