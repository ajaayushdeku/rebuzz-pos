import { DataPoint } from "@/lib/types/chart";

type RawBill = {
  grandTotal: number;
  costPrice: number;
  paidAt: string; // "2026-05-07 09:51:09"
  isRefunded: boolean;
};

/** Format a Date to "YYYY-MM-DD" using local time (avoiding UTC-based toISOString) */
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Groups bills by day label (e.g. "Mon") and sums revenue + profit
export const formatWeeklyData = (bills: RawBill[]): DataPoint[] => {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build a map keyed by "YYYY-MM-DD" for the last 7 days
  const last7Days: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push({
      date: formatLocalDate(d), // e.g. "2026-05-07"
      label: DAY_LABELS[d.getDay()], // "Wed"
    });
  }

  // Aggregate per day
  const revenueMap: Record<string, { revenue: number; profit: number }> = {};
  last7Days.forEach(({ date }) => {
    revenueMap[date] = { revenue: 0, profit: 0 };
  });

  bills.forEach((bill) => {
    if (bill.isRefunded) return;
    const dateKey = bill.paidAt.split(" ")[0]; // "2026-05-07"
    if (revenueMap[dateKey] !== undefined) {
      revenueMap[dateKey].revenue += bill.grandTotal;
      revenueMap[dateKey].profit += bill.grandTotal - bill.costPrice;
    }
  });

  // console.log("Map:", revenueMap);
  // console.log("Last 7 days:", last7Days);

  return last7Days.map(({ date, label }) => ({
    day: label,
    revenue: revenueMap[date].revenue,
    profit: revenueMap[date].profit,
  }));
};
