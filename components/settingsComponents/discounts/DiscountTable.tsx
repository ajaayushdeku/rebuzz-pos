import { useState } from "react";
import { Discount } from "@/app/(app)/settings/discount/page";
import {
  Edit3,
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
      {/* `table-fixed` with declared widths: each tab renders its own table,
          and auto layout sized the columns from whatever that tab held — so
          switching between "10%" and "Rs 1,000.00" shifted every column. */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-32" />
          <col className="w-24" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#e8eaed] text-[11px] tracking-wider text-[#5f6368] dark:border-white/10 dark:text-[#9aa6bd]">
            <th className="text-left pb-2.5 font-normal">S.No.</th>
            <th className="text-left pb-2.5 font-normal">Name</th>
            <th className="text-left pb-2.5 font-normal">Value</th>
            <th className="text-right pb-2.5 font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-10 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-[#7b869b]">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm">Loading discounts...</span>
                </div>
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="text-center py-2 text-sm text-gray-400 dark:text-[#7b869b]"
              >
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-white/10">
                    {discountType == "fixed" ? (
                      <DollarSign size={24} className="text-gray-500 dark:text-[#9aa6bd]" />
                    ) : (
                      <Percent size={24} className="text-gray-500 dark:text-[#9aa6bd]" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                    No discounts found
                  </p>
                  <p className="text-xs text-gray-400 mt-1 dark:text-[#7b869b]">
                    Create a discount to get started.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            paged.map((d, idx) => (
              <tr
                key={d._id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors dark:border-white/10 dark:hover:bg-white/5"
              >
                <td className="py-3 font-medium text-[11px] text-gray-400 dark:text-[#7b869b]">
                  #{idx + 1}
                </td>
                <td
                  className="truncate py-3 pr-3 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]"
                  title={d.name}
                >
                  {d.name}
                </td>
                <td className="whitespace-nowrap py-3 text-xs font-semibold tabular-nums text-emerald-600 dark:text-[#10b981]">
                  {d.type === "percentage"
                    ? `${d.rate}%`
                    : ` ${formatCurrencySymbol(d.rate, currency.symbol, currency.locale)}`}
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(d)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-[#7b869b] dark:hover:bg-blue-400/15 dark:hover:text-[#7ba2e3]"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(d._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
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
            Page {effectivePage + 1} of {totalPages} · {filtered.length} items
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

export default DiscountTable;
