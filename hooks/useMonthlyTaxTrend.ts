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

interface RawGroupedTax {
  name?: string;
  rate?: number;
  isEnabled?: boolean;
  taxes?: RawTax[];
}

interface RawDetailBill {
  paidAt?: string;
  isRefunded?: boolean;
  taxamt?: number;
  totalAmount?: number;
  grandTotal?: number;
  tax?: { taxes?: RawTax[]; groupedTaxes?: RawGroupedTax[] };
}

// ── Public shape ────────────────────────────────────────────────────────────
export interface TaxSeries {
  /** Stable dataKey for recharts (e.g. "s0"). */
  key: string;
  name: string;
  rate: number;
  /** e.g. "Water 15%". */
  label: string;
  /** True when this comes from the bill's `groupedTaxes`. */
  group: boolean;
}

export interface TaxTotal extends TaxSeries {
  /** Tax collected across the window. */
  collected: number;
  /** Taxable base (pre-tax amount) across the window. */
  base: number;
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
  totals: TaxTotal[];
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

/** Resolve a bill's applied tax → { name, rate, group } from taxes/groupedTaxes. */
function resolveTax(tax?: RawDetailBill["tax"]): {
  name: string;
  rate: number;
  group: boolean;
} {
  const regular = (tax?.taxes ?? []).filter((t) => t.isEnabled !== false);
  if (regular.length) {
    const rate = regular.reduce((sum, t) => sum + (Number(t.rate) || 0), 0);
    const name =
      regular
        .map((t) => t.name)
        .filter((n): n is string => !!n)
        .join(", ") || "Unknown Tax";
    return { name, rate, group: false };
  }

  const grouped = (tax?.groupedTaxes ?? []).filter((g) => g.isEnabled !== false);
  if (grouped.length) {
    const rate = grouped.reduce((sum, g) => {
      const own = Number(g.rate) || 0;
      const sub = (g.taxes ?? []).reduce((s, t) => s + (Number(t.rate) || 0), 0);
      return sum + (own || sub);
    }, 0);
    const name =
      grouped
        .map((g) => g.name)
        .filter((n): n is string => !!n)
        .join(", ") || "Grouped Tax";
    return { name, rate, group: true };
  }

  return { name: "Unknown Tax", rate: 0, group: false };
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

  // 2) Fetch each bill's detail (applied tax name/rate + amount + base).
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

  // 3) Aggregate per (month, tax series).
  const validKeys = new Set(slots.map((s) => s.key));
  const seriesBySig = new Map<string, TaxSeries>();
  const buckets: Record<string, Record<string, number>> = {};
  const totalsByKey: Record<string, { collected: number; base: number }> = {};

  for (const bill of details) {
    if (!bill || bill.isRefunded) continue;

    const amount = Number(bill.taxamt) || 0;
    if (amount <= 0) continue;

    const date = parseDate(bill.paidAt);
    if (!date) continue;
    const mKey = monthKey(date);
    if (!validKeys.has(mKey)) continue;

    // Actual taxable base: totalAmount, else grandTotal − tax.
    const base =
      Number(bill.totalAmount) ||
      Math.max(0, (Number(bill.grandTotal) || 0) - amount);

    const { name, rate, group } = resolveTax(bill.tax);
    const sig = `${group ? "g" : "r"}__${name}__${rate}`;
    let s = seriesBySig.get(sig);
    if (!s) {
      s = {
        key: `s${seriesBySig.size}`,
        name,
        rate,
        label: rate > 0 ? `${name} ${rate}%` : name,
        group,
      };
      seriesBySig.set(sig, s);
      totalsByKey[s.key] = { collected: 0, base: 0 };
    }

    if (!buckets[mKey]) buckets[mKey] = {};
    buckets[mKey][s.key] = (buckets[mKey][s.key] ?? 0) + amount;
    totalsByKey[s.key].collected += amount;
    totalsByKey[s.key].base += base;
  }

  const series = Array.from(seriesBySig.values()).sort(
    (a, b) => a.rate - b.rate,
  );

  const round = (v: number) => Math.round(v * 100) / 100;

  const rows: MonthlyTaxRow[] = slots.map((slot) => {
    const perSeries = buckets[slot.key] ?? {};
    const row: MonthlyTaxRow = { month: slot.label, total: 0 };
    for (const s of series) {
      const amt = round(perSeries[s.key] ?? 0);
      row[s.key] = amt;
      row.total += amt;
    }
    row.total = round(row.total);
    return row;
  });

  const totals: TaxTotal[] = series
    .map((s) => ({
      ...s,
      collected: round(totalsByKey[s.key]?.collected ?? 0),
      base: round(totalsByKey[s.key]?.base ?? 0),
    }))
    .filter((t) => t.collected > 0)
    .sort((a, b) => b.collected - a.collected);

  return { rows, series, totals };
}

export function useMonthlyTaxTrend() {
  return useQuery({
    queryKey: ["monthly-tax-trend"],
    queryFn: fetchMonthlyTaxTrend,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
