"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { SlowProduct } from "./slow-product-columns";
import { getDaysColor } from "@/lib/utils";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

type SlowProductsProps = {
  slowProducts: SlowProduct[];
};

export default function SlowProducts({ slowProducts }: SlowProductsProps) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const filtered = useMemo(() => {
    if (!search) return slowProducts;
    const q = search.toLowerCase();
    return slowProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [slowProducts, search]);

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full">
      <h1 className="font-bold text-[16px] md:text-xl text-gray-900 mt-1">
        Slow Moving Products
      </h1>
      <p className="text-gray-400 mt-0.5 text-sm">
        No sales in 3+ days, attention required.
      </p>

      {/* Search */}
      <div className="relative mt-4 mb-4">
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
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
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
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("days")}
              >
                <span className="flex items-center gap-1">
                  Days Idle {SortIcon({ colKey: "days" })}
                </span>
              </th>

              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("stockAmount")}
              >
                <span className="flex items-center justify-end gap-1">
                  Stock {SortIcon({ colKey: "stockAmount" })}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No products found
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => {
                const { text } = getDaysColor(product.days);
                return (
                  <tr
                    key={product.name}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {product.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-left font-semibold text-gray-900">
                      <span className={`font-semibold ${text}`}>
                        {product.days}+ days
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right text-gray-500">
                      {product.stockAmount} units
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">
          Page {page + 1} of {totalPages} · {sorted.length} products
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
