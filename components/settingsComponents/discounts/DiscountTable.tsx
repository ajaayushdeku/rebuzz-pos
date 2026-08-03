import { useState } from "react";
import { Discount } from "@/app/(app)/settings/discount/page";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Percent,
  DollarSign,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const PAGE_SIZE = 5;

const DiscountTable = ({
  discounts,
  discountType,
  search,
  onEdit,
  onDelete,
  loading = false,
}: {
  discounts: Discount[];
  discountType: string;
  search: string;
  onEdit: (d: Discount) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
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

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-gray-100">
            <th className="text-left pb-2.5 font-medium">#</th>
            <th className="text-left pb-2.5 font-medium">Name</th>
            <th className="text-left pb-2.5 font-medium">Value</th>
            <th className="text-right pb-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-10 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm">Loading discounts...</span>
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
                    {discountType == "fixed" ? (
                      <DollarSign size={24} className="text-gray-500" />
                    ) : (
                      <Percent size={24} className="text-gray-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    No discounts found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a discount to get started.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paged.map((d, idx) => (
              <tr
                key={d._id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3 font-medium text-xs text-gray-400">
                  {idx + 1}
                </td>
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

export default DiscountTable;
