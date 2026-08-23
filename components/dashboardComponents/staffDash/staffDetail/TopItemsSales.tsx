"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import TablePagination from "@/components/ui/TablePagination";

interface TopItem {
  itemId: string;
  itemName: string;
  totalQuantity: number;
}

interface TopItemsSalesProps {
  employeeId: string;
  dateRange: DateRangeValue;
}

interface TopItemEA {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface EmployeeAnalytics {
  businessName: string;

  period: {
    startDate: string;
    endDate: string;
  };

  employee: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };

  kpis: {
    totalBills: number;
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    avgBillValue: number;
    avgItemsPerBill: number;
    itemsSold: number;
    totalDiscount: number;
    redeemPoints: number;
    totalRefunds: number;
    refundedAmount: number;
    addonAttachRate: number;
    totalAddonsSold: number;
    totalAddonRevenue: number;
    totalShiftMinutes: number;
    salesPerHour: number;
    billsPerHour: number;
  };

  paymentSplit: {
    cash: number;
    qr: number;
    card: number;
    other: number;
  };

  dailyTimeline: {
    date: string;
    bills: number;
    revenue: number;
    profit: number;
  }[];

  hourlyDistribution: {
    hour: number;
    bills: number;
    revenue: number;
  }[];

  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];

  topCategories: {
    name: string;
    quantity: number;
    revenue: number;
  }[];

  shifts: {
    shiftId: string;
    openingTime: string;
    closingTime: string;
    durationMinutes: number;
  }[];

  recentBills: {
    _id: string;
    orderId: string;
    invoiceNo: number;
    paidBillNo: number;
    totalAmount: number;
    grandTotal: number;
    discount: number;
    paymentMethod: string;
    paidAt: string;
    createdAt: string;
  }[];
}

/** Rows per page. The list is paged rather than silently truncated. */
const PAGE_SIZE = 8;

/**
 * One row, whichever endpoint supplied it. The analytics API returns
 * {productId, name, quantity, revenue}; the top-items fallback returns
 * {itemId, itemName, totalQuantity}. Normalising here means the rows render
 * once instead of twice — the two shapes used to drive two near-identical
 * map() blocks.
 */
type TopItemRow = {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
};

/**
 * Bars are banded by how the item compares with the best seller, which is what
 * "fast vs slow movers" means. The top item is green by definition.
 */
function getBarColor(quantity: number, max: number): string {
  const ratio = max > 0 ? quantity / max : 0;
  if (ratio >= 0.6) return "#22c55e"; // fast — green
  if (ratio >= 0.3) return "#3b82f6"; // normal — blue
  return "#f59e0b"; // slow — amber
}

/**
 * Rank, name, bar, quantity. Rows and the axis share this template so the
 * ticks line up under the bars — the label column used to be `w-15` (not a
 * Tailwind size, so no width at all) while the axis reserved `w-24`, and the
 * two never agreed.
 */
const ROW_GRID =
  "grid grid-cols-[1.25rem_5.5rem_1fr_2.75rem] items-center gap-3 md:grid-cols-[1.25rem_7rem_1fr_4rem]";

const CARD = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

/** Header is identical in all four states; it used to be pasted into each. */
function Header({ subHeader }: { subHeader: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
        <TrendingUp size={16} className="text-emerald-500" />
      </div>
      <ComponentHeader title="Top Items Sold" subHeader={subHeader} />
    </div>
  );
}

export default function TopItemsSales({
  employeeId,
  dateRange,
}: TopItemsSalesProps) {
  const { currency } = useCurrency();
  const [items, setItems] = useState<TopItem[]>([]);
  const [topItems, setTopItems] = useState<TopItemEA[]>([]);
  const [noEmployeeAnalytics, setNoEmployeeAnalytics] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(0);

  // ── Load top items: try employee-analytics first, fall back to top-items ──
  useEffect(() => {
    if (!employeeId) return;

    const loadTopItems = async () => {
      setLoading(true);
      setError(null);
      setNoEmployeeAnalytics(false);
      setItems([]);
      setTopItems([]);
      // A new employee or date range is a new list; page 3 of the old one is
      // meaningless and would render empty.
      setPage(0);

      try {
        // ── 1. Try employee analytics API ────────────────────────────────────
        const eaRes = await fetch(
          `/api/employee-analytics/${employeeId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (eaRes.ok) {
          const eaData = await eaRes.json();
          if (eaData?.status === "success" && eaData.data) {
            const topProducts = eaData.data.topProducts ?? [];
            setTopItems(topProducts);

            // If analytics returned top products, we're done — no fallback needed
            if (topProducts.length > 0) {
              return;
            }
          }
        }

        // ── 2. Fallback: employee has no analytics data — use top-items API ──
        setNoEmployeeAnalytics(true);

        const tiRes = await fetch(
          `/api/staff/${employeeId}/top-items?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (!tiRes.ok) {
          throw new Error("Failed to fetch top items");
        }

        const tiData = await tiRes.json();
        if (tiData?.status === "success") {
          setItems(tiData.data.items ?? []);
        } else {
          throw new Error(tiData?.error || "Failed to fetch top items");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load top items",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTopItems();
  }, [employeeId, dateRange.startDate, dateRange.endDate, reload]);

  // ── Normalise both shapes into one list ───────────────────────────────────
  const rows: TopItemRow[] = useMemo(
    () =>
      noEmployeeAnalytics
        ? items.map((item) => ({
            id: item.itemId,
            name: item.itemName,
            quantity: item.totalQuantity,
          }))
        : topItems.map((item) => ({
            id: item.productId,
            name: item.name,
            quantity: item.quantity,
            revenue: item.revenue,
          })),
    [noEmployeeAnalytics, items, topItems],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={CARD}>
        <Header subHeader="Loading top selling items..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={CARD}>
        <Header subHeader="Unable to load data" />
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <button
            onClick={() => setReload((n) => n + 1)}
            className="mt-3 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className={CARD}>
        <Header subHeader="Units sold per item – fast vs slow movers" />
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No sales data available
          </p>
          <p className="mt-1 text-xs text-gray-400">
            No top items sold data for this period
          </p>
        </div>
      </div>
    );
  }

  // ── Render chart ──────────────────────────────────────────────────────────
  // Both derived from the whole list, not the page: bars stay comparable
  // across pages, and the header total covers every item.
  const max = Math.max(...rows.map((r) => r.quantity), 1);
  const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = rows.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  // De-duplicated, so a small max (0,0,1,1,1) does not produce repeated
  // React keys.
  const axisTicks = Array.from(
    new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))),
  );

  return (
    <div className={CARD}>
      <div className="flex items-start justify-between gap-3">
        <Header subHeader="Units sold per item by the employee" />

        {/* The list is paged, so the total says how much it covers. */}
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Units
          </span>
          <p className="mt-0.5 text-base font-bold leading-tight tabular-nums text-gray-900">
            {totalUnits.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {pagedRows.map((row, idx) => (
          <div key={row.id} className={ROW_GRID}>
            {/* Rank continues across pages — page 2 starts at 9, not 1. */}
            <span className="text-[11px] font-semibold tabular-nums text-gray-300">
              {safePage * PAGE_SIZE + idx + 1}
            </span>

            <span
              className="min-w-0 truncate text-xs leading-tight text-gray-600"
              title={row.name}
            >
              {row.name}
            </span>

            <div className="relative h-4 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-4 rounded-full transition-all duration-700"
                style={{
                  width: `${(row.quantity / max) * 100}%`,
                  backgroundColor: getBarColor(row.quantity, max),
                }}
              />
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold tabular-nums text-gray-700">
                {row.quantity.toLocaleString()}
              </span>
              {/* Only the analytics endpoint carries revenue. */}
              {/* {row.revenue !== undefined && (
                <span className="block truncate text-[10px] tabular-nums text-gray-400">
                  {formatCurrencySymbol(
                    row.revenue,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              )} */}
            </div>
          </div>
        ))}
      </div>

      {/* X-axis — same grid, so the ticks sit under the bars */}
      <div className={`${ROW_GRID} mt-4`}>
        <span />
        <span />
        <div className="flex justify-between">
          {axisTicks.map((tick, i) => (
            <span
              key={`${tick}-${i}`}
              className="text-[10px] tabular-nums text-gray-400"
            >
              {tick}
            </span>
          ))}
        </div>
        <span />
      </div>

      {totalPages > 1 && (
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          total={rows.length}
          noun="items"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
