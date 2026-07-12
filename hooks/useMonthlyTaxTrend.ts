"use client";

import { useQuery } from "@tanstack/react-query";

// ── Raw API shapes (subset we read) ─────────────────────────────────────────
interface RawListBill {
  invoiceNo?: number;
  isRefunded?: boolean;
}

interface RawTax {
  rate?: number;
  isEnabled?: boolean;
  name?: string;
}

interface RawDetailBill {
  paidAt?: string;
  isRefunded?: boolean;
  taxamt?: number;
  tax?: { taxes?: RawTax[] };
}

// ── Public shape ────────────────────────────────────────────────────────────
export interface TaxSeries {
  /** Stable dataKey for recharts (e.g. "s0"). */
  key: string;
  name: string;
  rate: number;
  /** e.g. "Water 15%". */
  label: string;
}

export interface MonthlyTaxRow {
  month: string;
  total: number;
  /** Per-series tax amount, keyed by TaxSeries.key. */
  [seriesKey: string]: number | string;
}

export interface MonthlyTaxTrend {
  rows: MonthlyTaxRow[];
  series: TaxSeries[];
}

// Cap the number of detail requests to keep the page responsive.
const MAX_DETAILS = 400;

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
const monthLabel = (d: Date) => d.toLocaleString("en-US", { month: "short" });

/** Parse "2026-07-10 07:12:12" or ISO → Date, else null. */
function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

async function fetchMonthlyTaxTrend(): Promise<MonthlyTaxTrend> {
  const now = new Date();

  // Last 6 Gregorian months (current + previous 5).
  const slots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: monthKey(d), label: monthLabel(d) };
  });
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .split("T")[0];
  const end = now.toISOString().split("T")[0];

  // 1) All bills in the window.
  const listRes = await fetch(
    `/api/tickets/bills?startDate=${start}&endDate=${end}&limit=5000`,
    { cache: "no-store" },
  );
  if (!listRes.ok) {
    throw new Error(`Failed to fetch bills: ${listRes.status}`);
  }
  const listJson = await listRes.json();
  const listBills: RawListBill[] = listJson?.data?.bill ?? [];

  const invoiceNos = listBills
    .filter((b) => !b.isRefunded && b.invoiceNo != null)
    .map((b) => b.invoiceNo as number)
    .slice(0, MAX_DETAILS);

  // 2) Fetch each bill's detail (for the applied tax name/rate + amount).
  const details = await Promise.all(
    invoiceNos.map(async (invoiceNo) => {
      try {
        const res = await fetch(`/api/transactions/${invoiceNo}`, {
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json?.data?.bill ?? null) as RawDetailBill | null;
      } catch {
        return null;
      }
    }),
  );

  // 3) Aggregate the bill-level tax amount per (month, tax series).
  const validKeys = new Set(slots.map((s) => s.key));
  // series signature → { key, name, rate, label }
  const seriesBySig = new Map<string, TaxSeries>();
  // buckets[monthKey][seriesKey] = amount
  const buckets: Record<string, Record<string, number>> = {};

  for (const bill of details) {
    if (!bill || bill.isRefunded) continue;

    const amount = Number(bill.taxamt) || 0;
    if (amount <= 0) continue;

    const date = parseDate(bill.paidAt);
    if (!date) continue;
    const mKey = monthKey(date);
    if (!validKeys.has(mKey)) continue;

    // Applied tax from the bill's outer `tax` object.
    const taxes = (bill.tax?.taxes ?? []).filter((t) => t.isEnabled !== false);
    const rate = taxes.reduce((sum, t) => sum + (Number(t.rate) || 0), 0);
    const name =
      taxes
        .map((t) => t.name)
        .filter((n): n is string => !!n)
        .join(", ") || "Unknown Tax";

    const sig = `${name}__${rate}`;
    let series = seriesBySig.get(sig);
    if (!series) {
      series = {
        key: `s${seriesBySig.size}`,
        name,
        rate,
        label: rate > 0 ? `${name} ${rate}%` : name,
      };
      seriesBySig.set(sig, series);
    }

    if (!buckets[mKey]) buckets[mKey] = {};
    buckets[mKey][series.key] = (buckets[mKey][series.key] ?? 0) + amount;
  }

  const series = Array.from(seriesBySig.values()).sort(
    (a, b) => a.rate - b.rate,
  );

  const rows: MonthlyTaxRow[] = slots.map((slot) => {
    const perSeries = buckets[slot.key] ?? {};
    const row: MonthlyTaxRow = { month: slot.label, total: 0 };
    for (const s of series) {
      const amt = Math.round((perSeries[s.key] ?? 0) * 100) / 100;
      row[s.key] = amt;
      row.total += amt;
    }
    row.total = Math.round(row.total * 100) / 100;
    return row;
  });

  return { rows, series };
}

export function useMonthlyTaxTrend() {
  return useQuery({
    queryKey: ["monthly-tax-trend"],
    queryFn: fetchMonthlyTaxTrend,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
