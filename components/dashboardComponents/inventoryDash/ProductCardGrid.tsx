"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  X,
  BoxesIcon,
  ChevronUp,
  ChevronDown,
  PackageCheck,
  PackageX,
  type LucideIcon,
} from "lucide-react";

import { InventoryItem } from "@/lib/mockData/mock-inventory-data";
import { useSalesByItemQuery } from "@/hooks/useInventory";
import { nameTokens } from "@/lib/salesVelocity";
import ProductCard from "@/components/product/ProductCard";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { useCategories } from "@/hooks/useCategories";
import { normalizeColor } from "@/services/category.client";

const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 8;

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
/**
 * The icon stands in for the label below `sm`. Three tabs with names this long
 * wrap the row on a phone, and the count beside each one is the part being
 * compared, so the label is what can go.
 */
const STOCK_TABS: {
  value: StockTab;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "all", label: "All", icon: BoxesIcon },
  { value: "tracked", label: "Tracked", icon: PackageCheck },
  { value: "untracked", label: "Untracked", icon: PackageX },
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

/**
 * A category filter chip. Selected chips take the category's own colour
 * through `style`; the rest are the plain outlined control of the other
 * cards, so one chip standing out means it is the one in force.
 */
const CATEGORY_PILL =
  "cursor-pointer rounded-full border bg-white dark:bg-white/5 px-3.5 py-1 text-xs transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/10";

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

/**
 * Stands in for one <ProductCard /> while the next page loads.
 *
 * Shaped like the card's collapsed header — thumbnail, two lines, a chevron —
 * so the grid does not re-flow when the real cards arrive. The old one was a
 * stack of four bars of nothing in particular and a different height.
 */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#e3e3e3] bg-white p-3 dark:border-white/10 dark:bg-[#161d2e]">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-200 sm:h-20 sm:w-20 dark:bg-white/15" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-white/15" />
          <div className="h-2.5 w-1/3 rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-white/15" />
          <div className="h-2.5 w-20 rounded bg-gray-100 dark:bg-white/10" />
        </div>
        <div className="h-7 w-7 shrink-0 rounded-full bg-gray-100 dark:bg-white/10" />
      </div>
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
            // Inherited, not assumed: a variant's stock figure only means
            // something when the product it belongs to is counted, and
            // hardcoding this put untracked variants in the "tracked" tab.
            usesStocks: item.usesStocks,
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
    <div className="flex flex-col gap-3">
      {/* Toolbar: search + sort */}
      <div className="mb-4 mt-6 flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]"
          />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#dadce0] bg-white pl-9 pr-9 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-[#e8ecf4]"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-[#7b869b] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center justify-between md:justify-end lg:w-auto lg:shrink-0">
          {/* Sort */}
          <div className="flex h-10 w-full items-center gap-2 sm:w-auto">
            <ArrowUpDown
              size={14}
              className="shrink-0 text-gray-400 dark:text-[#7b869b]"
            />

            <FilterSelect
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(val) => setSortBy(val as SortKey)}
              className="w-full py-1.5 text-[13px] sm:w-[170px]"
              buttonClassName="h-10 w-full rounded-xl px-3 text-xs tracking-wide"
              menuClassName="w-48 max-w-[calc(100vw-2rem)]"
            />
          </div>

          {/* Vertical divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-[#dadce0] dark:bg-white/15 hidden sm:inline" />

          {/* Stock filters */}
          <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
            <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-[#9aa6bd]">
              Stock
            </span>

            <div
              role="radiogroup"
              aria-label="Stock tracking"
              className="flex w-full items-center gap-1 rounded-xl border border-gray-200/80 bg-gray-100/80 p-0.5 sm:w-auto dark:border-white/10 dark:bg-white/[0.04]"
            >
              {STOCK_TABS.map((tab) => {
                const selected = stockTab === tab.value;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setStockTab(tab.value)}
                    className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171e2c] sm:flex-none sm:px-3 ${
                      selected
                        ? "bg-white font-semibold text-[#244074] shadow-sm ring-1 ring-black/[0.04] dark:bg-[#263750] dark:text-[#c2d8ff] dark:ring-white/[0.08]"
                        : "font-medium text-gray-500 hover:bg-white/60 hover:text-gray-800 dark:text-[#9aa6bd] dark:hover:bg-white/[0.06] dark:hover:text-[#e8ecf4]"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        selected
                          ? "text-[#244074] dark:text-[#a8c4ee]"
                          : "text-gray-400 dark:text-[#7b869b]"
                      }`}
                      aria-hidden
                    />

                    <span className="truncate text-[11px] sm:text-xs">
                      {tab.label}
                    </span>

                    <span
                      className={`inline-flex min-w-[22px] items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                        selected
                          ? "bg-blue-50 text-[#244074] dark:bg-white/10 dark:text-[#c2d8ff]"
                          : "bg-gray-200/70 text-gray-500 dark:bg-white/[0.07] dark:text-[#a9b4c7]"
                      }`}
                    >
                      {stockCounts[tab.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse  items-start justify-between gap-5  mb-4">
        <div className="flex items-center flex-wrap gap-2 ">
          {/* Default filters */}
          {defaultCategories.map((cat) => {
            const isActive = selectedCategory === cat._id;

            return (
              <button
                key={cat._id ?? cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat._id)}
                className={`${CATEGORY_PILL} ${
                  isActive
                    ? "text-[var(--pill-ink)] dark:text-[var(--pill-ink-dark)]"
                    : "border-[#dadce0] text-[#3c4043] dark:border-white/15 dark:text-[#e8ecf4]"
                }`}
                style={
                  isActive
                    ? ({
                        "--pill-ink": `color-mix(in oklab, ${categoryColor}, black 45%)`,
                        "--pill-ink-dark": `color-mix(in oklab, ${categoryColor}, white 45%)`,
                        backgroundColor: `${categoryColor}20`,
                        borderColor: categoryColor,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                {cat.name === "None" ? "Uncategorized" : cat.name}
              </button>
            );
          })}

          {/* Vertical divider */}
          <div className="mx-1 h-6 w-px shrink-0 bg-[#dadce0] dark:bg-white/15" />

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
                  className={`${CATEGORY_PILL} ${
                    isActive
                      ? "text-[var(--pill-ink)] dark:text-[var(--pill-ink-dark)]"
                      : "border-[#dadce0] text-[#3c4043] dark:border-white/15 dark:text-[#e8ecf4]"
                  }`}
                  style={
                    isActive
                      ? ({
                          "--pill-ink": `color-mix(in oklab, ${categoryColor}, black 45%)`,
                          "--pill-ink-dark": `color-mix(in oklab, ${categoryColor}, white 45%)`,
                          backgroundColor: `${categoryColor}20`,
                          borderColor: `color-mix(in oklab, ${categoryColor}, white 15%)`,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {cat.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* Empty state */}
      {processed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <BoxesIcon
              size={24}
              className="text-[#9aa0a6] dark:text-[#9aa6bd]"
            />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No products found
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            Filtered product data will appear here
          </p>

          {search && (
            <p className="mt-1 text-xs text-gray-300 dark:text-[#6b7588]">
              Try a different search term.
            </p>
          )}
        </div>
      )}

      {/* Product Grid */}
      {/* One column on a phone, which is the shape the card is now built
          for — a wide short row rather than a tall tile. `xl:grid-cols-3`
          was dropped as a no-op: it repeated the `lg` value. Three stays
          the ceiling because the opened panel has figures like "In-Stock
          value (sell)" to fit, and a fourth column starves them. */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] disabled:opacity-50 dark:border-white/15 dark:text-[#e8ecf4] dark:hover:bg-white/10 dark:bg-white/5"
            >
              {loading && (
                <svg
                  className="animate-spin h-3.5 w-3.5 text-gray-500 dark:text-[#9aa6bd]"
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
                  <ChevronDown size={12} /> Show more
                </span>
              )}
            </button>
          )}

          {canHide && (
            <button
              onClick={handleHide}
              disabled={loading}
              className="flex cursor-pointer flex-row items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-[#e8ecf4] dark:hover:bg-white/10 dark:bg-white/5"
            >
              <ChevronUp size={12} />
              Show less
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
