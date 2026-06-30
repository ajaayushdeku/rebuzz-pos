import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";
import { PeakHourlyData } from "@/components/dashboardComponents/salesRevenue/PeakHoursAnalysis";

export const formatHourlyData = (
  bills: { grandTotal: number; paidAt: string; isRefunded?: boolean }[],
  hourRange?: { start: number; end: number },
): HourlyData[] => {
  const startHour = hourRange?.start ?? 0;
  const endHour = hourRange?.end ?? 23;

  const hourMap: Record<string, number> = {};

  for (let h = startHour; h <= endHour; h++) {
    hourMap[formatHourLabel(h)] = 0;
  }

  bills.forEach((bill) => {
    if (bill.isRefunded) return;

    const paidAt = bill.paidAt ?? "";
    if (!paidAt) return;

    const timePart = paidAt.includes("T")
      ? paidAt.split("T")[1]
      : paidAt.split(" ")[1];

    if (!timePart) return;

    let hour = parseInt(timePart.split(":")[0], 10);
    let minute = parseInt(timePart.split(":")[1], 10);

    // If hour is less than 12,
    // it means it's UTC time from MongoDB
    // so convert to Nepal time (+5:45)
    if (hour < 12) {
      minute += 45;

      if (minute >= 60) {
        minute -= 60;
        hour += 1;
      }

      hour += 5;

      if (hour >= 24) {
        hour -= 24;
      }
    }

    const label = formatHourLabel(hour);

    if (hourMap[label] !== undefined) {
      hourMap[label] += bill.grandTotal;
    }
  });

  return Object.entries(hourMap).map(([hour, revenue]) => ({
    hour,
    revenue: Math.round(revenue * 100) / 100,
  }));
};

/** Derive the Nepal-adjusted hour-of-day [0-23] from a `paidAt` string, or null. */
const deriveHourFromPaidAt = (paidAt: string): number | null => {
  if (!paidAt) return null;
  const timePart = paidAt.includes("T")
    ? paidAt.split("T")[1]
    : paidAt.split(" ")[1];
  if (!timePart) return null;

  let hour = parseInt(timePart.split(":")[0], 10);
  let minute = parseInt(timePart.split(":")[1], 10);
  if (Number.isNaN(hour)) return null;
  if (Number.isNaN(minute)) minute = 0;

  // If hour is less than 12, it's UTC time from MongoDB — convert to Nepal (+5:45).
  if (hour < 12) {
    minute += 45;
    if (minute >= 60) {
      minute -= 60;
      hour += 1;
    }
    hour += 5;
    if (hour >= 24) hour -= 24;
  }
  return hour;
};

/** Derive the date portion (YYYY-MM-DD) from a `paidAt` string, or null. */
const deriveDateFromPaidAt = (paidAt: string): string | null => {
  if (!paidAt) return null;
  const datePart = paidAt.includes("T")
    ? paidAt.split("T")[0]
    : paidAt.split(" ")[0];
  return datePart || null;
};

/**
 * Average order count and revenue for each hour (00–23) across the days that
 * actually have data for that hour.
 *
 * Bills are first grouped by (date, hour) and aggregated into per-day hourly
 * totals; each hour's average is then `sum(per-day totals) / days-with-data`,
 * NOT an average over individual transactions or over every day in the range.
 *
 * Example — 09:00 with Jun 1 → 10, Jun 5 → 5, Jun 8 → 7 orders:
 *   averageSales = (10 + 5 + 7) / 3 = 7.33
 */
export const formatPeakHourAverages = (
  bills: { grandTotal: number; paidAt: string; isRefunded?: boolean }[],
): PeakHourlyData[] => {
  // perHour[hour] = { [date]: { sales, revenue } }
  const perHour: Record<
    number,
    Record<string, { sales: number; revenue: number }>
  > = {};
  for (let h = 0; h <= 23; h++) perHour[h] = {};

  bills.forEach((bill) => {
    if (bill.isRefunded) return;
    const hour = deriveHourFromPaidAt(bill.paidAt);
    const date = deriveDateFromPaidAt(bill.paidAt);
    if (hour === null || date === null) return;

    if (!perHour[hour][date]) perHour[hour][date] = { sales: 0, revenue: 0 };
    perHour[hour][date].sales += 1; // one order/bill
    perHour[hour][date].revenue += bill.grandTotal ?? 0;
  });

  return Array.from({ length: 24 }, (_, h) => {
    const dayTotals = Object.values(perHour[h]);
    const daysWithData = dayTotals.length;
    const totalSales = dayTotals.reduce((sum, d) => sum + d.sales, 0);
    const totalRevenue = dayTotals.reduce((sum, d) => sum + d.revenue, 0);

    return {
      hour: formatHourLabel(h),
      sales:
        daysWithData > 0
          ? Math.round((totalSales / daysWithData) * 100) / 100
          : 0,
      revenue:
        daysWithData > 0
          ? Math.round((totalRevenue / daysWithData) * 100) / 100
          : 0,
    };
  });
};

export const formatHourLabel = (hour: number): string => {
  const h = hour.toString().padStart(2, "0");
  return `${h}:00`;
};

export const HOUR_RANGES = [
  { label: "00:00 – 07:59", start: 0, end: 7 },
  { label: "08:00 – 15:59", start: 8, end: 15 },
  { label: "16:00 – 23:59", start: 16, end: 23 },
  { label: "All Day (00:00 – 23:59)", start: 0, end: 23 },
];
