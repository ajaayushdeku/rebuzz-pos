"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";

type TimePeriod = "morning" | "lunch" | "afternoon" | "evening";

interface TimeWindow {
  period: TimePeriod;
  title: string;
  /** [start, end) in 24h local hours. */
  start: number;
  end: number;
}

// Fixed time-of-day windows (matching the original design).
const WINDOWS: TimeWindow[] = [
  { period: "morning", title: "MORNING (6AM-11AM)", start: 6, end: 11 },
  { period: "lunch", title: "LUNCH (11AM-2PM)", start: 11, end: 14 },
  { period: "afternoon", title: "AFTERNOON (2PM-5PM)", start: 14, end: 17 },
  { period: "evening", title: "EVENING (5PM-9PM)", start: 17, end: 21 },
];

// The list endpoint has no line items — each bill's items come from its own
// detail call, so we cap how many bills we resolve to keep the request count
// sane, and fetch them in small concurrent batches.
const MAX_BILLS = 120;
const CONCURRENCY = 10;

interface Transaction {
  invoiceNo?: number;
  timestamp?: string; // "HH:mm" (already Nepal-local)
  status?: string;
}

interface DetailItem {
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

interface TimeWiseProduct {
  period: TimePeriod;
  title: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

/** Run an async mapper over items with a fixed concurrency. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

async function fetchTransactions(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const res = await fetch(
    `/api/order-history/transactions?startDate=${startDate}&endDate=${endDate}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  const json = await res.json();
  return (json?.data ?? []) as Transaction[];
}

/** A single bill's line items (from its detail). */
async function fetchBillItems(invoiceNo: number): Promise<DetailItem[]> {
  try {
    const res = await fetch(`/api/transactions/${invoiceNo}`);
    if (!res.ok) return [];
    const json = await res.json();
    const entries = json?.data?.bill?.items ?? [];
    return entries.flatMap(
      (entry: { item?: DetailItem[] }) => entry?.item ?? [],
    );
  } catch {
    return [];
  }
}

/**
 * Two-stage: the transactions list gives each bill's time + invoice number, and
 * each bill's items are pulled from its detail. Bills are bucketed by time of
 * day, products aggregated per window, and the top product is chosen by a
 * combined score of revenue and units sold (each normalised within the window).
 */
async function buildTimeWiseProducts(
  startDate: string,
  endDate: string,
): Promise<TimeWiseProduct[]> {
  const txns = await fetchTransactions(startDate, endDate);

  const bills = txns
    .filter(
      (t) => t.status !== "refunded" && t.invoiceNo != null && !!t.timestamp,
    )
    .slice(0, MAX_BILLS);

  const withItems = await mapLimit(bills, CONCURRENCY, async (t) => ({
    hour: parseInt((t.timestamp ?? "").split(":")[0], 10),
    items: await fetchBillItems(t.invoiceNo as number),
  }));

  const perWindow = WINDOWS.map(
    () => new Map<string, { units: number; revenue: number }>(),
  );

  for (const { hour, items } of withItems) {
    if (Number.isNaN(hour)) continue;
    const wi = WINDOWS.findIndex((w) => hour >= w.start && hour < w.end);
    if (wi < 0) continue;

    for (const li of items) {
      const name = li?.productName || "Unknown";
      const qty = Number(li?.quantity) || 0;
      const revenue = (Number(li?.unitPrice) || 0) * qty;
      const bucket = perWindow[wi];
      const cur = bucket.get(name) ?? { units: 0, revenue: 0 };
      cur.units += qty;
      cur.revenue += revenue;
      bucket.set(name, cur);
    }
  }

  return WINDOWS.map((w, i) => {
    const entries = [...perWindow[i].entries()];
    // Normalise within the window so revenue (large) and units (small) are
    // comparable, then rank by their combined (equally-weighted) score.
    const maxRevenue = Math.max(0, ...entries.map(([, v]) => v.revenue));
    const maxUnits = Math.max(0, ...entries.map(([, v]) => v.units));

    let top: { name: string; units: number; revenue: number } | null = null;
    let topScore = -1;
    for (const [name, v] of entries) {
      const score =
        (maxRevenue > 0 ? v.revenue / maxRevenue : 0) +
        (maxUnits > 0 ? v.units / maxUnits : 0);
      if (score > topScore) {
        topScore = score;
        top = { name, ...v };
      }
    }

    return {
      period: w.period,
      title: w.title,
      productName: top?.name ?? "—",
      unitsSold: top?.units ?? 0,
      revenue: top?.revenue ?? 0,
    };
  });
}

export default function TimeWiseProductAnalysis({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["timewise-products", startDate, endDate],
    queryFn: () => buildTimeWiseProducts(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Header */}
      <div className="mb-4 md:mb-5">
        <ComponentHeader
          title="Time-Wise Product Analysis"
          subHeader="Top performing products specific to times of day"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="ml-2 text-sm">Loading analysis...</span>
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-sm text-red-500">
          Couldn&apos;t load time-wise analysis. Please try again.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.map((item) => (
            <div
              key={item.period}
              className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {item.title}
              </p>

              <h3 className="mt-3 text-sm font-semibold text-gray-800">
                {item.productName}
              </h3>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {item.unitsSold} units sold
                </span>
                <span className="text-xs font-semibold text-green-600">
                  {fmt(item.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
