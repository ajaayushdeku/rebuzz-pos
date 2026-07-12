"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";

import { InventoryItem } from "@/lib/mockData/mock-inventory-data";
import { useSalesByItemQuery } from "@/hooks/useInventory";
import ProductCard from "./ProductCard";

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 6;

// Item-based sorts (fields on the inventory item itself).
type ItemSortKey =
  | "stock-desc"
  | "stock-asc"
  | "price-desc"
  | "price-asc"
  | "cost-desc"
  | "cost-asc";

// Sales-based sorts (revenue / net profit for the selected range).
type SalesSortKey =
  | "revenue-desc"
  | "revenue-asc"
  | "profit-desc"
  | "profit-asc";

type SortKey = "default" | ItemSortKey | SalesSortKey;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "stock-desc", label: "Stock: High → Low" },
  { value: "stock-asc", label: "Stock: Low → High" },
  { value: "price-desc", label: "Selling Price: High → Low" },
  { value: "price-asc", label: "Selling Price: Low → High" },
  { value: "cost-desc", label: "Cost Price: High → Low" },
  { value: "cost-asc", label: "Cost Price: Low → High" },
  { value: "revenue-desc", label: "Revenue: High → Low" },
  { value: "revenue-asc", label: "Revenue: Low → High" },
  { value: "profit-desc", label: "Net Profit: High → Low" },
  { value: "profit-asc", label: "Net Profit: Low → High" },
];

const SORT_COMPARATORS: Record<
  ItemSortKey,
  (a: InventoryItem, b: InventoryItem) => number
> = {
  "stock-desc": (a, b) => b.inStock - a.inStock,
  "stock-asc": (a, b) => a.inStock - b.inStock,
  "price-desc": (a, b) => b.price - a.price,
  "price-asc": (a, b) => a.price - b.price,
  "cost-desc": (a, b) => b.costPrice - a.costPrice,
  "cost-asc": (a, b) => a.costPrice - b.costPrice,
};

const SALES_SORT_KEYS: SalesSortKey[] = [
  "revenue-desc",
  "revenue-asc",
  "profit-desc",
  "profit-asc",
];

/** Skeleton card shown while loading more items */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative p-2">
      <div className="h-2 rounded-lg bg-gray-200 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-full" />
    </div>
  );
}

const ProductCardGrid = ({
  items,
  startDate,
  endDate,
}: {
  items: InventoryItem[];
  startDate: string;
  endDate: string;
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("default");

  // Per-product revenue, net profit & order count for the selected range.
  const { data: sales } = useSalesByItemQuery(startDate, endDate);
  const salesMap = useMemo(() => {
    const map = new Map<
      string,
      { revenue: number; netProfit: number; orderCount: number }
    >();
    for (const s of sales ?? []) {
      map.set(s.name.toLowerCase(), {
        revenue: s.totalRevenue ?? 0,
        netProfit: s.netProfit ?? 0,
        orderCount: s.count ?? 0,
      });
    }
    return map;
  }, [sales]);

  // Search (by name) then sort. Kept memoized so cards don't re-process on
  // unrelated re-renders.
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? items.filter((i) => i.name.toLowerCase().includes(q))
      : items;

    if (sortBy === "default") return filtered;

    // Sales-based sorts read revenue / net profit from the range data.
    if ((SALES_SORT_KEYS as string[]).includes(sortBy)) {
      const metric = (item: InventoryItem) => {
        const s = salesMap.get(item.name.toLowerCase());
        return sortBy.startsWith("revenue")
          ? (s?.revenue ?? 0)
          : (s?.netProfit ?? 0);
      };
      const dir = sortBy.endsWith("-asc") ? 1 : -1;
      return [...filtered].sort((a, b) => (metric(a) - metric(b)) * dir);
    }

    return [...filtered].sort(SORT_COMPARATORS[sortBy as ItemSortKey]);
  }, [items, search, sortBy, salesMap]);

  // Reset the "Load More" window whenever the search or sort changes.
  const filterKey = `${search}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(INITIAL_COUNT);
  }

  const visibleItems = processed.slice(0, visibleCount);

  const hasMore = visibleCount < processed.length;
  const canHide = visibleCount > INITIAL_COUNT;

  const handleLoadMore = useCallback(() => {
    setLoading(true);
    // Simulate brief loading delay for smooth UX
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, processed.length),
      );
      setLoading(false);
    }, 600);
  }, [processed.length]);

  const handleHide = useCallback(() => {
    setVisibleCount(INITIAL_COUNT);
  }, []);

  const skeletonCount = Math.min(
    LOAD_MORE_COUNT,
    processed.length - visibleCount,
  );

  return (
    <div>
      {/* Toolbar: search + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-9 text-xs border border-gray-200 rounded-lg px-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {processed.length === 0 && (
        <div className="flex flex-col items-center py-10 text-gray-400 text-sm">
          <span className="font-medium">No products found</span>
          {search && (
            <p className="mt-1 text-xs text-gray-300">
              Try a different search term.
            </p>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
        {visibleItems.map((item, idx) => {
          const sale = salesMap.get(item.name.toLowerCase());
          return (
            <div
              key={item.id}
              className="animate-fadeIn"
              style={{
                animationDelay: `${(idx % LOAD_MORE_COUNT) * 60}ms`,
                animationFillMode: "both",
              }}
            >
              <ProductCard
                item={item}
                revenue={sale?.revenue}
                netProfit={sale?.netProfit}
                orderCount={sale?.orderCount}
              />
            </div>
          );
        })}

        {/* Loading skeleton cards */}
        {loading &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Actions */}
      {(hasMore || canHide) && (
        <div className="flex items-center justify-center gap-3 mb-3">
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {loading ? "Loading..." : "Load More"}
            </button>
          )}

          {canHide && (
            <button
              onClick={handleHide}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hide
            </button>
          )}
        </div>
      )}

      {/* Fade-in animation keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProductCardGrid;
