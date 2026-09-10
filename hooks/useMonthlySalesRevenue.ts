"use client";

import { useQuery } from "@tanstack/react-query";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * A local calendar date, built from parts.
 *
 * Never `toISOString`, which converts to UTC and in any positive offset turns
 * local midnight on the 1st into the last day of the month before.
 */
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * The report window for one calendar month, clamped to today.
 *
 * The report API rejects a range whose end is in the future rather than
 * returning the days that exist, so the current month has to stop at today.
 * A month that has not started yet has no window at all.
 */
export function monthWindow(
  month: number,
  year: number,
  now: Date = new Date(),
): { start: string; end: string } | null {
  const start = iso(new Date(year, month - 1, 1));
  // Day 0 of the next month is the last day of this one, so February and the
  // leap years take care of themselves.
  const monthEnd = iso(new Date(year, month, 0));
  const today = iso(now);

  if (start > today) return null;
  return { start, end: monthEnd < today ? monthEnd : today };
}

async function fetchMonthRevenue(start: string, end: string): Promise<number> {
  const res = await fetch(
    `/api/report?startDate=${start}&endDate=${end}&limit=1`,
    { headers: { "Content-Type": "application/json" }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);

  const json = await res.json();
  return Number(json?.data?.report?.totalRevenue) || 0;
}

/**
 * Point-of-sale revenue for one calendar month.
 *
 * The expense tracker knows only what was typed into it, so a card that wants
 * a cost "as a share of revenue" cannot get that share from tracker data — the
 * tracker's income total is miscellaneous income, not sales. This reads the
 * same report figure the Profit & Cost page uses, so the two agree.
 */
export function useMonthlySalesRevenue(month: number, year: number) {
  const window = monthWindow(month, year);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["month-sales-revenue", window?.start, window?.end],
    queryFn: () => fetchMonthRevenue(window!.start, window!.end),
    enabled: window !== null,
    staleTime: 5 * 60 * 1000,
  });

  return {
    salesRevenue: data ?? 0,
    // A month still in the future is settled, not loading: there is nothing to
    // fetch and nothing to wait for.
    isLoading: window !== null && isLoading,
    isError,
    /** False when the figure is missing, so callers can avoid a false zero. */
    hasRevenue: window !== null && !isError && data !== undefined,
  };
}
