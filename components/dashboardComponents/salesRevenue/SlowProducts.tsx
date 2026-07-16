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
import { SlowProduct } from "./slow-product-columns";
import { getDaysColor } from "@/lib/utils";
import { useSlowProducts } from "@/hooks/useSlowProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const DAYS_PRESETS = [
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

export default function SlowProducts({
  slowProducts: initialData,
}: {
  slowProducts?: SlowProduct[];
}) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Days filter state (local to this component only)
  const [days, setDays] = useState(3);
  const [customDays, setCustomDays] = useState("");

  // Fetch data via React Query hook
  const { data: fetchedData, isFetching } = useSlowProducts(days);
  const slowProducts = fetchedData ?? initialData ?? [];

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full">
      <h2 className="text-sm font-bold text-gray-900">Slow Moving Products</h2>
      <p className="text-xs text-gray-400 mt-0.5">
        Products with no sales in selected period, attention required.
      </p>

      {/* Search + Days preset */}
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

        {/* Days preset dropdown + custom input */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom days input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              placeholder="Custom"
              onChange={(e) => {
                const val = e.target.value;
                setCustomDays(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) {
                  setDays(num);
                  setPage(0);
                }
              }}
              className="w-16 h-9 px-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">days</span>
          </div>

          <Select
            value={String(days)}
            onValueChange={(val) => {
              setDays(Number(val));
              setCustomDays("");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[90px] h-9 text-sm">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_PRESETS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"> */}
      <div className="bg-white overflow-hidden">
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
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
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
                      <span className="font-medium text-xs text-gray-900">
                        {product.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-left font-semibold text-xs text-gray-900">
                      <span className={`font-semibold ${text}`}>
                        {product.days}+ days
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right text-xs text-gray-500">
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
