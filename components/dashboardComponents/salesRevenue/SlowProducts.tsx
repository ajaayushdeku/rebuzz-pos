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
  PackageCheck,
  TrendingDown,
} from "lucide-react";
import { SlowProduct } from "./slow-product-columns";
import { getDaysColor } from "@/lib/utils";
import { useSlowProducts } from "@/hooks/useSlowProducts";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { formatNumber } from "@/utils/helper";
import { ChartCard } from "../chartCard";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const DAYS_PRESETS = [
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

/** Header cell: quiet grey label, normal weight, clickable to sort. */
const TH =
  "px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#3c4043]";
/** Body cell: small text in the title colour. */
const TD = "px-3 py-2.5 text-xs";

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
    return slowProducts.filter((p) =>
      [p.name, p.productName, p.variantLabel]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q)),
    );
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
    <ChartCard
      icon={TrendingDown}
      // Red: Tailwind's red-600 / red-200 / red-50, as CSS colours.
      iconColor="#dc2626"
      iconBorder="#fecaca"
      iconBg="#fef2f2"
      title="Slow Moving Products"
      info={{
        heading: "Reading this card",
        body: "Products, and each variant on its own, with no sales in the last few days up to today. The window is set on this card, not by the date range at the top of the page. Days idle shows that window rather than the exact days since the last sale; stock is the units in stock now.",
      }}
      subtitle="Products with no sales in selected period, attention required."
      controls={
        // The card's own window: a custom day count or a preset.
        <div className="flex flex-row items-center gap-2 block md:hidden">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              placeholder="Custom"
              aria-label="Custom number of days"
              onChange={(e) => {
                const val = e.target.value;
                setCustomDays(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) {
                  setDays(num);
                  setPage(0);
                }
              }}
              // Spinner arrows hidden: at this size they covered the
              // placeholder ("Custo…"), and the field is for typing a number.
              className="h-[26px] w-[72px] rounded-lg border bg-white px-2.5 text-[11px] outline-none [appearance:textfield] placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4] dark:bg-white/5"
            />
            <span className="text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
              days
            </span>
          </div>

          <div className="mx-1 h-6 w-px bg-[#dadce0] dark:bg-white/15" />

          {/* FilterSelect owns its trigger's classes, so the pill look is
              applied to its button from the wrapper. */}
          <FilterSelect
            value={String(days)}
            options={DAYS_PRESETS}
            onChange={(val) => {
              setDays(Number(val));
              setCustomDays("");
              setPage(0);
            }}
            placeholder="Select days"
            className="w-[85px] sm:w-[100px] md:w-[100px]  [&>button]:rounded-lg [&>button]:border-[#dadce0] [&>button]:py-1 [&>button]:pl-2.5 [&>button]:pr-2 [&>button]:text-[11px] [&>button]:text-[#3c4043]"
          />
        </div>
      }
      className="h-full"
    >
      <div className="flex flex-row items-center justify-center gap-2  mb-3 w-full">
        {" "}
        {/* Search */}
        <div className="relative  w-full ">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border bg-white py-2 pl-8 pr-8 text-[11px] outline-none placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-blue-500 border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4] dark:bg-white/5"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#9aa0a6] hover:text-[#5f6368] dark:text-[#9aa6bd] dark:hover:text-[#e8ecf4]"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className=" hidden md:block">
          {" "}
          <div className=" flex flex-row items-center justify-center w-full gap-2">
            {" "}
            <div className="flex flex-row items-center gap-1">
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                placeholder="Custom"
                aria-label="Custom number of days"
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDays(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0) {
                    setDays(num);
                    setPage(0);
                  }
                }}
                // Spinner arrows hidden: at this size they covered the
                // placeholder ("Custo…"), and the field is for typing a number.
                className="h-[26px] w-[72px] rounded-lg border bg-white py-2 px-2.5 text-[11px] outline-none [appearance:textfield] placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4] dark:bg-white/5"
              />
              <span className="text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                days
              </span>
            </div>
            <div className="mx-1 h-6 w-px bg-[#dadce0] dark:bg-white/15" />
            {/* FilterSelect owns its trigger's classes, so the pill look is
              applied to its button from the wrapper. */}
            <FilterSelect
              value={String(days)}
              options={DAYS_PRESETS}
              onChange={(val) => {
                setDays(Number(val));
                setCustomDays("");
                setPage(0);
              }}
              placeholder="Select days"
              className="w-[80px] [&>button]:rounded-lg [&>button]:border-[#dadce0] [&>button]:py-1 [&>button]:pl-2.5 [&>button]:pr-2 [&>button]:text-[11px] [&>button]:text-[#3c4043]"
            />
          </div>
        </div>
      </div>

      {/* Table: no zebra or shadow, hairline rows, quiet grey headings. */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left border-[#e8eaed] dark:border-white/10 text-[#5f6368] dark:text-[#a9b4c7]">
              <th className="w-12 px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap">
                S.No
              </th>
              <th className={TH} onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">
                  Product {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("days")}>
                <span className="flex items-center gap-1">
                  Days Idle {SortIcon({ colKey: "days" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("stockAmount")}>
                <span className="flex items-center justify-end gap-1">
                  Stock {SortIcon({ colKey: "stockAmount" })}
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="text-[#3c4043] dark:text-[#e8ecf4]">
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] dark:border-[#7ba2e3]"
                      style={{ borderTopColor: "transparent" }}
                    />
                    <span className="text-xs text-[#5f6368] dark:text-[#a9b4c7]">
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-2 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    {/* Green: an empty list here is good news. */}
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-emerald-400/10">
                      <PackageCheck
                        size={22}
                        className="text-green-600 dark:text-emerald-400"
                      />
                    </div>
                    <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
                      No slow moving product data
                    </p>
                    <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                      All products sales are in good state.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => {
                const { text } = getDaysColor(product.days);
                return (
                  <tr
                    key={`${product.productName ?? product.name}-${product.variantLabel ?? ""}`}
                    className="border-b transition-colors last:border-0 hover:bg-[#f8f9fa] border-[#e8eaed] dark:hover:bg-white/10 dark:border-white/10"
                  >
                    <td
                      className={`${TD} tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]`}
                    >
                      {page * pageSize + idx + 1}
                    </td>

                    {/* `name` already reads "Coke [Medium/Cherry]" for a
                        variant row. */}
                    <td className={TD}>{product.name}</td>

                    {/* Orange or red by how long the window is: the status
                        colour stays, since it is what flags the row. */}
                    <td className={`${TD} whitespace-nowrap`}>
                      <span className={`font-medium ${text}`}>
                        {product.days}+ days
                      </span>
                    </td>

                    <td
                      className={`${TD} whitespace-nowrap text-right tabular-nums`}
                    >
                      {formatNumber(product.stockAmount)} units
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page === 0
              ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7]"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium dark:text-[#7b869b]">
          Page {page + 1} of {totalPages} · {sorted.length} products
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7]"
          }`}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </ChartCard>
  );
}
