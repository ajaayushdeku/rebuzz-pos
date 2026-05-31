"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { TopProduct, getTopProductColumns } from "./top-product-columns";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import { getPercentColor } from "@/lib/utils";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

type TopProductsProps = {
  topProducts: TopProduct[];
};

export default function TopProducts({ topProducts }: TopProductsProps) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full">
      <h1 className="font-bold mt-1 text-[16px] md:text-xl text-gray-900">
        Top Selling Products
      </h1>
      <p className="text-gray-400 mt-0.5 text-sm">
        Products contributing most to revenue growth
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
              {/* <th className="text-left pb-3 pt-3 px-4 font-medium">Category</th> */}

              <th
                className="text-center pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("revenue")}
              >
                <span className="flex items-center gap-1">
                  Revenue {SortIcon({ colKey: "revenue" })}
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
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No products found
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
                      <span className="font-medium text-gray-900">
                        {product.name}
                      </span>
                    </td>
                    {/* <td className="py-3 px-4 text-gray-600">
                      {product.category}
                    </td> */}
                    <td className="py-3 px-4 text-left font-semibold text-gray-900">
                      {formatCurrency(product.revenue, currency)}
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
