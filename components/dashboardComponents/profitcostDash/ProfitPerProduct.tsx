"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Product } from "./profit-per-product-column";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

function getMarginColor(percent: number): string {
  if (percent >= 60) return "text-green-600";
  if (percent >= 40) return "text-yellow-600";
  return "text-red-500";
}

function getProfitColor(profit: number): string {
  if (profit > 0) return "text-green-600";
  if (profit < 0) return "text-red-600";
  return "text-gray-600";
}

export default function ProfitPerProduct({
  products,
}: {
  products: Product[];
}) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key] ?? "";
      const bVal = (b as Record<string, unknown>)[sortConfig.key] ?? "";
      const aNum = typeof aVal === "number" ? aVal : parseFloat(String(aVal));
      const bNum = typeof bVal === "number" ? bVal : parseFloat(String(bVal));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);


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

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <div className="min-w-0 mb-4">
        <h1 className="font-bold mt-1 md:text-xl text-[16px] text-gray-900">
          Profit per Product
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Revenue, cost and margins for top selling products.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
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
                onClick={() => toggleSort("revenue")}
              >
                <span className="flex items-center justify-end gap-1">
                  Revenue {SortIcon({ colKey: "revenue" })}
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("cogs")}
              >
                <span className="flex items-center justify-end gap-1">
                  COGS {SortIcon({ colKey: "cogs" })}
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("profit")}
              >
                <span className="flex items-center justify-end gap-1">
                  Profit {SortIcon({ colKey: "profit" })}
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("margin")}
              >
                <span className="flex items-center justify-end gap-1">
                  Margin {SortIcon({ colKey: "margin" })}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No products found
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => (
                <tr
                  key={product.name + idx}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      {product.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(product.revenue, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-red-600">
                    -{formatCurrency(product.cogs, currency)}
                  </td>

                  <td
                    className={`py-3 px-4 text-right font-semibold  ${getProfitColor(product.profit)}`}
                  >
                    {formatCurrency(product.profit, currency)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${getMarginColor(product.margin)}`}
                    >
                      {product.margin}%
                    </span>
                  </td>
                </tr>
              ))
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
