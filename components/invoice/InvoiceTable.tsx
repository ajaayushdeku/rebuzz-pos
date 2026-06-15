// "use client";

// import { useRouter } from "next/navigation";

// import { Invoice } from "@/lib/types/invoice";

// import { DataTable } from "@/components/ui/data-table";
// import { getInvoiceColumns } from "./invoice-columns";
// import { useCurrency } from "@/providers/CurrencyContext";

// export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
//   const { currency } = useCurrency();
//   const columns = getInvoiceColumns(currency);
//   const router = useRouter();

//   return (
//     <DataTable
//       columns={columns}
//       data={invoices}
//       searchColumn="invoice"
//       searchPlaceholder="Search invoice #..."
//       pageSize={10}
//       onRowClick={(row: Invoice) => {
//         console.log(row.invoice);
//         router.push(`/invoices/${row.invoice}`);
//       }}
//       filters={[
//         {
//           columnId: "status",
//           label: "Status",
//           options: ["unpaid", "completed", "pending"],
//         },
//       ]}
//       showColumnToggle
//     />
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Wallet,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Invoice } from "@/lib/types/invoice";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatDatetime } from "@/utils/helper";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  unpaid: "bg-red-100 text-red-700 border-red-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  overdue: "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_FILTER_OPTIONS = ["paid", "unpaid"];

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        String(inv.invoice).includes(q) ||
        (inv.customer_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (inv.status ?? "").toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600 capitalize"
        >
          <option value="all">All Status</option>
          {STATUS_FILTER_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white  overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("invoice")}
              >
                <span className="flex items-center gap-1">
                  Invoice # {SortIcon({ colKey: "invoice" })}
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              <th
                className="flex items-center pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Amount {SortIcon({ colKey: "amount" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("created_at")}
              >
                <span className="flex items-center gap-1">
                  Date {SortIcon({ colKey: "created_at" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Status</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              paged.map((inv, idx) => {
                const status = (inv.status ?? "").toLowerCase();
                return (
                  <tr
                    key={inv.invoice}
                    onClick={() => router.push(`/invoices/${inv.invoice}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        ORD-{inv.invoice}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {inv.customer_name ?? "—"}
                    </td>

                    <td className="py-3 px-4 text-left font-semibold text-gray-900">
                      {/* {formatCurrency(Number(inv.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(inv.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {formatDatetime(inv.created_at)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {inv.status ?? "—"}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            router.push(`/invoices/${inv.invoice}`)
                          }
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Make payment"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/invoices/${inv.invoice}/edit`)
                          }
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit invoice"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {}}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium">
          Page {page + 1} of {totalPages} · {sorted.length} invoices
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
}
