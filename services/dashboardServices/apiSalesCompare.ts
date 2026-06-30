// ── Normalised output type ────────────────────────────────────────────────

export interface CompareSalesPoint {
  label: string;
  totalSales: number;
  totalRevenue: number;
}

// ── Internal raw types ────────────────────────────────────────────────────

interface RawDaily {
  date: string;
  totalSales: number;
  totalRevenue: number;
}

interface RawWeekly {
  weekStart: string;
  totalSales: number;
  totalRevenue: number;
}

interface RawMonthly {
  monthStart: string;
  totalSales: number;
  totalRevenue: number;
}

// ── Single proxy route helper ──────────────────────────────────────────────

const PROXY_PREFIX = "/api/report/compare-sales";

async function fetchCompareSales<T>(
  type: "date" | "week" | "month",
  startDate?: string,
  endDate?: string,
): Promise<CompareSalesPoint[]> {
  let url = `${PROXY_PREFIX}/${type}`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok)
    throw new Error(`Failed to fetch compare-sales-by-${type}: ${res.status}`);

  const json = await res.json();
  const raw = (json?.data ?? []) as T[];
  return normalize(raw, type);
}

// ── Normalizer ─────────────────────────────────────────────────────────────

function normalize<T>(
  raw: T[],
  type: "date" | "week" | "month",
): CompareSalesPoint[] {
  return raw.map((p) => {
    switch (type) {
      case "date": {
        const d = p as unknown as RawDaily;
        return {
          label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          totalSales: d.totalSales,
          totalRevenue: d.totalRevenue,
        };
      }
      case "week": {
        const w = p as unknown as RawWeekly;
        const date = new Date(w.weekStart + "T00:00:00");
        const month = date.toLocaleDateString("en-US", { month: "short" }); // "Mar", "Apr", etc.
        const day = date.getDate();
        const weekNum = Math.ceil(day / 7);
        return {
          label: `Wk ${weekNum} of ${month}`,
          totalSales: w.totalSales,
          totalRevenue: w.totalRevenue,
        };
      }
      case "month": {
        const m = p as unknown as RawMonthly;
        return {
          label: new Date(m.monthStart + "T00:00:00").toLocaleDateString(
            "en-US",
            { month: "short" }, // just "Jan", "Feb", etc.
          ),
          totalSales: m.totalSales,
          totalRevenue: m.totalRevenue,
        };
      }
    }
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

export const getCompareSalesByDate = (
  startDate?: string,
  endDate?: string,
): Promise<CompareSalesPoint[]> =>
  fetchCompareSales<RawDaily>("date", startDate, endDate);

export const getCompareSalesByWeek = (
  startDate?: string,
  endDate?: string,
): Promise<CompareSalesPoint[]> =>
  fetchCompareSales<RawWeekly>("week", startDate, endDate);

export const getCompareSalesByMonth = (
  startDate?: string,
  endDate?: string,
): Promise<CompareSalesPoint[]> =>
  fetchCompareSales<RawMonthly>("month", startDate, endDate);

export const getCompareSalesByYear = async (
  startDate?: string,
  endDate?: string,
): Promise<CompareSalesPoint[]> => {
  let url = `${PROXY_PREFIX}/year`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok)
    throw new Error(`Failed to fetch compare-sales-by-year: ${res.status}`);

  const json = await res.json();
  const raw: { yearStart: string; totalSales: number; totalRevenue: number }[] =
    json?.data ?? [];

  return raw.map((p) => ({
    label: p.yearStart,
    totalSales: p.totalSales,
    totalRevenue: p.totalRevenue,
  }));
};
