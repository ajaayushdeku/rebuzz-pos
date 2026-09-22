"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
} from "lucide-react";
import { Product } from "./profit-per-product-column";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useProfitPerProduct } from "@/hooks/useProfitPerProduct";
import RangeBadge from "@/components/ui/RangeBadge";
import { CHART_PALETTE, ChartCard } from "../chartCard";

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

/** Header cell: quiet grey label, normal weight, clickable to sort. */
const TH =
  "px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#3c4043]";
/** Body cell: small text in the title colour. */
const TD = "px-3 py-2.5 text-xs";

export default function ProfitPerProduct({
  products: initialProducts,
  startDate,
  endDate,
}: {
  products: Product[];
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Fetch data via React Query hook, driven by the global date range
  const { data: fetchedData, isFetching } = useProfitPerProduct(
    startDate,
    endDate,
  );
  const products = fetchedData ?? initialProducts ?? [];

  // The sales report does not always carry tax per line. Rather than show a
  // column of dashes, the column appears only once something reports one.
  const hasTax = products.some((p) => p.tax !== null);

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
    <ChartCard
      icon={Package}
      title="Profit per Product"
      info={{
        heading: "Reading this card",
        // From lib/profitPerProduct (mergeSalesItems) over salesByItem.
        body: "Each product sold in the date range at the top of the page, with same-named items merged. COGS is each item's cost price times the units sold; profit is the sales report's own figure for the item, and margin is that profit as a share of its revenue.",
      }}
      subtitle="Revenue, cost and margins for top selling products."
      controls={<RangeBadge variant="pill" />}
      className="overflow-hidden"
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

      {/* Table: no zebra or shadow, hairline rows, quiet grey headings;
          horizontally scrollable on mobile. */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[600px] table-auto">
          <thead>
            <tr
              className="border-b text-left"
              style={{
                borderColor: CHART_PALETTE.grid,
                color: CHART_PALETTE.axis,
              }}
            >
              <th className="w-12 px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap">
                S.No
              </th>
              <th className={TH} onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">
                  Product {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("revenue")}>
                <span className="flex items-center justify-end gap-1">
                  Revenue {SortIcon({ colKey: "revenue" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("cogs")}>
                <span className="flex items-center justify-end gap-1">
                  COGS {SortIcon({ colKey: "cogs" })}
                </span>
              </th>
              {/* Hidden entirely when the report carries no tax, rather than
                  shown as a column of dashes taking room from the figures
                  that are there. */}
              {/* {hasTax && (
                <th
                  className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                  onClick={() => toggleSort("tax")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Tax {SortIcon({ colKey: "tax" })}
                  </span>
                </th>
              )} */}
              <th className={TH} onClick={() => toggleSort("profit")}>
                <span className="flex items-center justify-end gap-1">
                  Profit {SortIcon({ colKey: "profit" })}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("margin")}>
                <span className="flex items-center justify-end gap-1">
                  Margin {SortIcon({ colKey: "margin" })}
                </span>
              </th>
            </tr>
          </thead>

          <tbody style={{ color: CHART_PALETTE.title }}>
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={hasTax ? 7 : 6} className="py-12 text-center">
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
                <td colSpan={hasTax ? 7 : 6} className="py-2 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <Package
                        size={22}
                        style={{ color: CHART_PALETTE.subtitle }}
                      />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      No product data
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      Profit Per Product data will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => (
                <tr
                  key={product.name + idx}
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
                    {formatCurrencySymbol(
                      product.revenue,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>
                  {/* A cost, so shown as money going out. */}
                  <td className={`${TD} text-right tabular-nums text-red-600`}>
                    -
                    {formatCurrencySymbol(
                      product.cogs,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>
                  {/* {hasTax && (
                    <td className="py-3 px-4 text-right tracking-wide font-semibold text-xs text-gray-500">
                    
                      {product.tax === null
                        ? "—"
                        : formatCurrencySymbol(
                            product.tax,
                            currency.symbol,
                            currency.locale,
                          )}
                    </td>
                  )} */}

                  <td
                    className={`${TD} text-right tabular-nums font-medium ${getProfitColor(product.profit)}`}
                  >
                    {formatCurrencySymbol(
                      product.profit,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>

                  <td className={`${TD} text-right tabular-nums`}>
                    <span
                      className={`font-medium ${getMarginColor(product.margin)}`}
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
