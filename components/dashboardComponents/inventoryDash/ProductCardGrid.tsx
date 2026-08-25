"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  X,
  BoxesIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { InventoryItem } from "@/lib/mockData/mock-inventory-data";
import { useSalesByItemQuery } from "@/hooks/useInventory";
import { nameTokens } from "@/lib/salesVelocity";
import ProductCard from "@/components/product/ProductCard";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { useCategories } from "@/hooks/useCategories";
import { normalizeColor } from "@/services/category.client";

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

// Stock-tracking filter tabs.
type StockTab = "all" | "tracked" | "untracked";
const STOCK_TABS: { value: StockTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tracked", label: "Stock Track" },
  { value: "untracked", label: "Non-Stock Track" },
];

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

type SaleFigures = {
  revenue: number;
  netProfit: number;
  orderCount: number;
};

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
  const [stockTab, setStockTab] = useState<StockTab>("tracked");

  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (!selectedCategory && categories.length) {
      const allCategory = categories.find((cat) => cat.name === "All");
      setSelectedCategory(allCategory?._id);
    }
  }, [categories, selectedCategory]);

  const selectedCategoryData = categories.find(
    (cat) => cat._id === selectedCategory,
  );
  const categoryColor = selectedCategoryData
    ? normalizeColor(selectedCategoryData.color)
    : undefined;

  const defaultCategories = categories.filter(
    (cat) => cat.name === "All" || cat.name === "None",
  );

  const customCategories = categories.filter(
    (cat) => cat.name !== "All" && cat.name !== "None",
  );

  // Per-product revenue, net profit & order count for the selected range.
  //
  // Keyed by name *tokens* rather than the raw name. salesByItem names variant
  // rows with bracket notation — "Jelly [s,m,l]", "EGG [Soft Boil]" — but the
  // spacing isn't consistent: one row arrives as "Jelly [red, blue ,pink]"
  // while joining optionValues here produces "Jelly [red,blue,pink]". An exact
  // compare misses that row; sorted alphanumeric words match it.
  const { data: sales } = useSalesByItemQuery(startDate, endDate);
  const salesMap = useMemo(() => {
    const map = new Map<string, SaleFigures>();
    for (const s of sales ?? []) {
      map.set(nameTokens(s.name), {
        revenue: s.totalRevenue ?? 0,
        netProfit: s.netProfit ?? 0,
        orderCount: s.count ?? 0,
      });
    }
    return map;
  }, [sales]);

  // Expand products that have variances into one card per variant. Each variant
  // inherits the base product's image and taxable status, but carries its own
  // name (base + option values), price, cost and stock. A product without
  // variants passes through unchanged.
  const expandedItems = useMemo(() => {
    const out: InventoryItem[] = [];
    for (const item of items) {
      if (item.variants && item.variants.length > 0) {
        for (const v of item.variants) {
          out.push({
            ...item, // inherit image, images, isTaxable, unit, orderedCount…
            id: v.id,
            name:
              v.optionValues.length > 0
                ? `${item.name} [${v.optionValues.join(",")}]`
                : item.name,
            price: v.price,
            costPrice: v.costPrice,
            inStock: v.inStock,
            lowStock: v.lowStock,
            usesStocks: true,
            isAvailable: v.isAvailable,
            variants: undefined,
          });
        }
      } else {
        out.push(item);
      }
    }
    return out;
  }, [items]);

  // Variant card id → its parent, so a card can fall back to the product-level
  // sales row when the API doesn't break sales out by variant.
  const parentByCardId = useMemo(() => {
    const map = new Map<string, { name: string; variantCount: number }>();
    for (const item of items) {
      const variants = item.variants ?? [];
      if (variants.length === 0) continue;
      for (const v of variants) {
        map.set(v.id, { name: item.name, variantCount: variants.length });
      }
    }
    return map;
  }, [items]);

  // Sales for a card: its own row when one exists, otherwise the parent's —
  // flagged, because those totals cover every variant and printing them
  // unlabelled on each card would read as if each variant earned that much.
  const salesFor = useCallback(
    (item: InventoryItem): { sale?: SaleFigures; sharedVariants: number } => {
      const own = salesMap.get(nameTokens(item.name));
      if (own) return { sale: own, sharedVariants: 0 };

      const parent = parentByCardId.get(item.id);
      if (!parent) return { sharedVariants: 0 };

      const parentSale = salesMap.get(nameTokens(parent.name));
      return parentSale
        ? { sale: parentSale, sharedVariants: parent.variantCount }
        : { sharedVariants: 0 };
    },
    [salesMap, parentByCardId],
  );

  // Counts per stock-tracking tab (over the fully expanded list).
  const stockCounts = useMemo(() => {
    const tracked = expandedItems.filter((i) => i.usesStocks).length;
    return {
      all: expandedItems.length,
      tracked,
      untracked: expandedItems.length - tracked,
    };
  }, [expandedItems]);

  // Search (by name) then sort. Kept memoized so cards don't re-process on
  // unrelated re-renders.
  const processed = useMemo(() => {
    // 1. Stock filter
    const byStock =
      stockTab === "all"
        ? expandedItems
        : expandedItems.filter((i) =>
            stockTab === "tracked" ? i.usesStocks : !i.usesStocks,
          );

    // 2. Search filter
    const q = search.trim().toLowerCase();
    const bySearch = q
      ? byStock.filter((i) => i.name.toLowerCase().includes(q))
      : byStock;

    // 3. Category filter
    const allCategoryId = categories.find((cat) => cat.name === "All")?._id;
    const noneCategoryId = categories.find((cat) => cat.name === "None")?._id;

    const byCategory =
      selectedCategory === allCategoryId
        ? bySearch
        : selectedCategory === noneCategoryId
          ? bySearch.filter((i) => !i.categories)
          : bySearch.filter((i) => i.categories === selectedCategory);

    if (sortBy === "default") return byCategory;

    // 4. Sorting
    if ((SALES_SORT_KEYS as string[]).includes(sortBy)) {
      // Goes through the same resolver as the cards, so variants sort by their
      // real figures instead of all reading as zero.
      const metric = (item: InventoryItem) => {
        const { sale } = salesFor(item);
        return sortBy.startsWith("revenue")
          ? (sale?.revenue ?? 0)
          : (sale?.netProfit ?? 0);
      };

      const dir = sortBy.endsWith("-asc") ? 1 : -1;

      return [...byCategory].sort((a, b) => (metric(a) - metric(b)) * dir);
    }

    return [...byCategory].sort(SORT_COMPARATORS[sortBy as ItemSortKey]);
  }, [
    expandedItems,
    search,
    selectedCategory,
    categories,
    sortBy,
    salesFor,
    stockTab,
  ]);

  // Reset the "Load More" window whenever the search, sort or tab changes.
  const filterKey = `${search}|${sortBy}|${stockTab}`;
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

        {/* Right controls: sort dropdown (left) then stock-tracking tabs (right) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown size={14} className="text-gray-400" />
            <FilterSelect
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(val) => setSortBy(val as SortKey)}
              className="w-[200px]"
            />
          </div>

          {/* Stock-tracking tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {STOCK_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStockTab(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  stockTab === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    stockTab === tab.value
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stockCounts[tab.value]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        {/* Default filters */}
        {defaultCategories.map((cat) => {
          const isActive = selectedCategory === cat._id;

          return (
            <button
              key={cat._id ?? cat.name}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className="px-4 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 bg-white border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600"
              style={{
                color: isActive ? categoryColor : undefined,
                backgroundColor: isActive ? `${categoryColor}30` : undefined,
                borderColor: isActive ? categoryColor : undefined,
              }}
            >
              {cat.name === "None" ? "Uncategorized" : cat.name}
            </button>
          );
        })}

        {/* Vertical divider */}
        <div className="mx-1 h-6 w-px bg-gray-300 shrink-0" />

        {/* User categories */}
        {customCategories
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((cat) => {
            const isActive = selectedCategory === cat._id;

            return (
              <button
                key={cat._id ?? cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat._id)}
                className="px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 bg-white border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600"
                style={{
                  color: isActive ? categoryColor : undefined,
                  backgroundColor: isActive ? `${categoryColor}20` : undefined,
                  borderColor: isActive ? categoryColor : undefined,
                }}
              >
                {cat.name}
              </button>
            );
          })}
      </div>

      {/* Empty state */}
      {processed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <BoxesIcon size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">No products found</p>
          <p className="text-xs text-gray-400 mt-1">
            Filtered product data will appear here
          </p>

          {search && (
            <p className="mt-1 text-xs text-gray-300">
              Try a different search term.
            </p>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-3">
        {visibleItems.map((item, idx) => {
          const { sale, sharedVariants } = salesFor(item);
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
                sharedVariants={sharedVariants}
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
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

              {loading ? (
                "Loading..."
              ) : (
                <span className="flex flex-row items-center gap-1">
                  <ChevronDown size={14} /> Load More
                </span>
              )}
            </button>
          )}

          {canHide && (
            <button
              onClick={handleHide}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center gap-1"
            >
              <ChevronUp size={14} />
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
