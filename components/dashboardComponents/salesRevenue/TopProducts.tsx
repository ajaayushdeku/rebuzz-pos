"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { TopProduct } from "./top-product-columns";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { getPercentColor } from "@/lib/utils";
import { useTopProducts } from "@/hooks/useTopProducts";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function TopProducts({
  topProducts: initialData,
  startDate,
  endDate,
}: {
  topProducts?: TopProduct[];
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Fetch data via React Query hook, driven by the global date range
  const { data: fetchedData, isFetching } = useTopProducts(startDate, endDate);
  const topProducts = fetchedData ?? initialData ?? [];

  const filtered = useMemo(() => {
    if (!search) return topProducts;
    const q = search.toLowerCase();
    return topProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [topProducts, search]);

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Top Selling Products
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Products contributing most to revenue growth
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center gap-2 mt-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black-300 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"> */}
      <div className="bg-white  overflow-hidden">
        <table className="table-auto text-sm w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium whitespace-nowrap">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Product {SortIcon({ colKey: "name" })}
                </span>
              </th>

              <th
                className="whitespace-nowrap text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("count")}
              >
                <span className="flex w-fit whitespace-nowrap items-center gap-1">
                  Sold {SortIcon({ colKey: "count" })}
                </span>
              </th>

              <th
                className="whitespace-nowrap text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("revenue")}
              >
                <span className="flex items-center gap-1">
                  Revenue {SortIcon({ colKey: "revenue" })}
                </span>
              </th>

              <th
                className="text-center whitespace-nowrap pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("netProfit")}
              >
                <span className="flex items-center gap-1">
                  Net Profit {SortIcon({ colKey: "netProfit" })}
                </span>
              </th>

              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("percent")}
              >
                <span className="flex items-center justify-end gap-1">
                  Growth {SortIcon({ colKey: "percent" })}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No products found for selected date range
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => {
                const { badge, ArrowIcon } = getPercentColor(product.percent);
                return (
                  <tr
                    key={product.name}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-xs text-gray-900">
                        {product.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-semibold text-xs text-gray-900">
                      {product.count}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-xs text-gray-900">
                      {/* {formatCurrency(product.revenue, currency)} */}
                      {formatCurrencySymbol(
                        product.revenue,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-xs text-green-600">
                      {/* {formatCurrency(product.netProfit, currency)} */}
                      {formatCurrencySymbol(
                        product.netProfit,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${badge}`}
                      >
                        <ArrowIcon size={12} />
                        {product.percent}%
                      </span>
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
          Page {page + 1} of {totalPages} · {sorted.length} products
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
    </div>
  );
}
