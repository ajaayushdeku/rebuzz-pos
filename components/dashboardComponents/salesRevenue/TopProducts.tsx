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
  Trophy,
} from "lucide-react";
import { TopProduct } from "./top-product-columns";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatNumber } from "@/utils/helper";
import { getPercentColor } from "@/lib/utils";
import { useTopProducts } from "@/hooks/useTopProducts";
import RangeBadge from "@/components/ui/RangeBadge";
import { CHART_PALETTE, ChartCard } from "../chartCard";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

/** Header cell: quiet grey label, normal weight, clickable to sort. */
const TH =
  "px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#3c4043]";
/** Body cell: small text in the title colour. */
const TD = "px-3 py-2.5 text-xs";

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
    <ChartCard
      icon={Trophy}
      // Amber: Tailwind's amber-600 / amber-200 / amber-50, as CSS colours.
      iconColor="#d97706"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Top Selling Products"
      info={{
        heading: "Reading this card",
        body: "Products sold in the date range at the top of the page, most units sold first until you sort by a column. Sold, revenue and net profit are totals for the range, with same-named items merged. The last column is each product's share of all units sold in the range.",
      }}
      subtitle="Products contributing most to revenue growth"
      controls={<RangeBadge variant="pill" />}
      className="h-full"
    >
      {/* Search */}
      <div className="relative mb-3 w-full">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: CHART_PALETTE.subtitle }}
        />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full rounded-lg border bg-white py-2 pl-8 pr-8 text-[11px] outline-none placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.title,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#9aa0a6] hover:text-[#5f6368]"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table: no zebra or shadow, hairline rows, quiet grey headings. */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr
              className="border-b text-left"
              style={{
                borderColor: CHART_PALETTE.grid,
                color: CHART_PALETTE.axis,
              }}
            >
              <th className="px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap">
                S.No
              </th>
              <th className={TH} onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">
                  Product {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("count")}>
                <span className="flex items-center justify-end gap-1">
                  Sold {SortIcon({ colKey: "count" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("revenue")}>
                <span className="flex items-center justify-end gap-1">
                  Revenue {SortIcon({ colKey: "revenue" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("netProfit")}>
                <span className="flex items-center justify-end gap-1">
                  Net Profit {SortIcon({ colKey: "netProfit" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("percent")}>
                <span className="flex items-center justify-end gap-1">
                  Growth {SortIcon({ colKey: "percent" })}
                </span>
              </th>
            </tr>
          </thead>

          <tbody style={{ color: CHART_PALETTE.title }}>
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{
                        borderColor: CHART_PALETTE.blue,
                        borderTopColor: "transparent",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: CHART_PALETTE.axis }}
                    >
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-2 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <Trophy size={22} style={{ color: CHART_PALETTE.axis }} />
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      No top selling product data
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      Top selling products data will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => {
                const { badge, ArrowIcon } = getPercentColor(product.percent);
                return (
                  <tr
                    key={product.name}
                    className="border-b transition-colors last:border-0 hover:bg-[#f8f9fa]"
                    style={{ borderColor: CHART_PALETTE.grid }}
                  >
                    <td
                      className={`${TD} tabular-nums`}
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      {page * pageSize + idx + 1}
                    </td>

                    <td className={TD}>{product.name}</td>

                    <td className={`${TD} text-right tabular-nums`}>
                      {formatNumber(product.count, currency.locale)}
                    </td>

                    <td
                      className={`${TD} whitespace-nowrap text-right tabular-nums`}
                    >
                      {formatCurrencySymbol(
                        product.revenue,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    {/* Neutral like its neighbours; red only when the item
                        lost money, since that is the case worth spotting. */}
                    <td
                      className={`${TD} whitespace-nowrap text-right tabular-nums ${
                        product.netProfit < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {formatCurrencySymbol(
                        product.netProfit,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className={`${TD} text-right`}>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${badge}`}
                      >
                        <ArrowIcon size={11} />
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
    </ChartCard>
  );
}
