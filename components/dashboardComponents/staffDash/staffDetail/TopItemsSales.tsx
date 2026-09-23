"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { CardInfo, CHART_PALETTE, ChartPager } from "../../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

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

const CARD =
  "w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5";

/** Header is identical in all four states; it used to be pasted into each. */
function Header({
  subHeader,
  pager,
}: {
  subHeader: string;
  /** The "‹ 1–8 of 24 ›" control, once there is more than one page. */
  pager?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-row items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{ borderColor: "#a7f3d0", backgroundColor: "#ecfdf5" }}
        >
          <TrendingUp size={16} style={{ color: "#059669" }} />
        </div>
        <div className="min-w-0">
          <h3
            className="flex items-center gap-1.5 text-[15px] font-normal"
            style={{ color: CHART_PALETTE.title }}
          >
            Top Items Sold
            <CardInfo
              heading="Reading this card"
              label="Top Items Sold"
              // Ranked over the page's range; the bar is against the top item.
              body="Units this employee sold of each product over the date range at the top of the page, best seller first. Each bar is measured against the top item in the whole list, so bars stay comparable as you page through. Units in the corner counts every item in the list, not just this page."
            />
          </h3>
          <p
            className="mt-0.5 text-xs tracking-wide"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {subHeader}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RangeBadge variant="pill" />
        {pager}
      </div>
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
  const rows: TopItemRow[] = useMemo(() => {
    const raw: TopItemRow[] = noEmployeeAnalytics
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
        }));

    // Rows are merged only when the whole name matches — two rows both called
    // "Jelly [short]" are the same thing counted twice, so their sales add up.
    // Variants keep their own rows: "Jelly [small]" and "Jelly [large]" sold
    // separately and are reported separately, even though they share a product
    // id. The list is re-sorted afterwards, since merging can change the
    // ranking.
    const merged = new Map<string, TopItemRow>();
    for (const row of raw) {
      const key = row.name.trim();
      const seen = merged.get(key);
      if (!seen) {
        merged.set(key, { ...row });
        continue;
      }
      seen.quantity += row.quantity;
      if (row.revenue !== undefined) {
        seen.revenue = (seen.revenue ?? 0) + row.revenue;
      }
    }

    return [...merged.values()].sort((a, b) => b.quantity - a.quantity);
  }, [noEmployeeAnalytics, items, topItems]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={CARD}>
        <Header subHeader="Loading top selling items..." />
        <div className="flex items-center justify-center py-12">
          <Loader2
            size={20}
            className="animate-spin"
            style={{ color: CHART_PALETTE.subtitle }}
          />
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
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            {error}
          </p>
          <button
            onClick={() => setReload((n) => n + 1)}
            className="mt-3 cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
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
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <TrendingUp size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No sales data available
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
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
        <Header
          subHeader="Units sold per item by the employee"
          pager={
            totalPages > 1 && (
              <ChartPager
                first={safePage * PAGE_SIZE + 1}
                last={Math.min((safePage + 1) * PAGE_SIZE, rows.length)}
                total={rows.length}
                onPrev={() => setPage(Math.max(0, safePage - 1))}
                onNext={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                itemLabel="items"
              />
            )
          }
        />

        {/* The list is paged, so the total says how much it covers. */}
        <div className="flex shrink-0 flex-col items-end">
          <span
            className="text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            Units
          </span>
          <p
            className="mt-0.5 text-base font-semibold leading-tight tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {totalUnits.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {pagedRows.map((row, idx) => (
          // Keyed by position in the whole list, not by id: the rank is unique
          // by construction, so a row can never be reused across pages even if
          // the data ever repeats an id again.
          <div key={safePage * PAGE_SIZE + idx} className={ROW_GRID}>
            {/* Rank continues across pages — page 2 starts at 9, not 1. */}
            <span
              className="text-[11px] tabular-nums"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {safePage * PAGE_SIZE + idx + 1}
            </span>

            <span
              className="min-w-0 truncate text-[13px] leading-tight"
              style={{ color: CHART_PALETTE.title }}
              title={row.name}
            >
              {row.name}
            </span>

            <div
              className="relative h-4 overflow-hidden rounded-full"
              style={{ backgroundColor: CHART_PALETTE.grid }}
            >
              <div
                className="h-4 rounded-full transition-all duration-700"
                style={{
                  width: `${(row.quantity / max) * 100}%`,
                  backgroundColor: getBarColor(row.quantity, max),
                }}
              />
            </div>

            <div className="text-right">
              <span
                className="text-[13px] font-medium tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
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
              className="text-xs tabular-nums"
              style={{ color: CHART_PALETTE.axis }}
            >
              {tick}
            </span>
          ))}
        </div>
        <span />
      </div>
    </div>
  );
}
