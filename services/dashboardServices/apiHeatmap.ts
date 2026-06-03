import { HeatmapDataSet } from "@/components/dashboardComponents/overviewDash/heatmap/Heatmap";
import { authHeaders } from "../authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────

type RawBill = {
  paidAt: string;
  isRefunded?: boolean;
  grandTotal?: number;
};

function parseNepalHour(paidAt: string): {
  hour: number;
  dayOfWeek: number;
  dateStr: string;
} {
  if (!paidAt) return { hour: -1, dayOfWeek: -1, dateStr: "" };

  const normalized = paidAt.includes("T")
    ? paidAt.replace("Z", "")
    : paidAt.replace(" ", "T");

  // Extract raw hour directly from the string before any conversion
  const timePart = normalized.split("T")[1] ?? "";
  const rawHour = parseInt(timePart.split(":")[0], 10);
  const rawMinute = parseInt(timePart.split(":")[1], 10);

  let finalDate: Date;

  if (rawHour >= 12) {
    // ── Already Nepal time — use as-is ───────────────────────────────────
    // e.g. "2026-06-04 14:30:00" is already 2:30 PM Nepal time
    finalDate = new Date(normalized);
  } else {
    // ── UTC time — convert to Nepal (+5h 45m) ────────────────────────────
    // e.g. "2026-06-04 06:15:00" is 06:15 UTC = 11:00 AM Nepal
    finalDate = new Date(normalized + "+00:00"); // treat as UTC
    // Add 5 hours 45 minutes
    finalDate.setMinutes(finalDate.getMinutes() + 5 * 60 + 45);
  }

  return {
    hour: finalDate.getHours(),
    dayOfWeek: finalDate.getDay(), // 0=Sun...6=Sat
    dateStr: finalDate.toISOString().split("T")[0],
  };
}

// ── Label helpers ─────────────────────────────────────────────────────────
const HOUR_LABELS = [
  "7am",
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
];

// 7am = hour 7, 8am = 8, ..., 12pm = 12, 1pm = 13, ..., 9pm = 21
const hourToLabel = (hour: number): string | null => {
  if (hour === 12) return "12pm";
  if (hour >= 7 && hour <= 11) return `${hour}am`;
  if (hour >= 13 && hour <= 21) return `${hour - 12}pm`;
  return null; // outside tracked range
};

// 0 = Sun → remap to Mon-first: Sun becomes index 6
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayOfWeekToLabel = (jsDay: number): string => {
  // JS: 0=Sun,1=Mon...6=Sat → Mon-first array index
  const monFirst = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_LABELS[monFirst];
};

// Which week of the month (1-indexed, max 4)
// function getWeekOfMonth(date: Date): string {
//   const day = date.getDate();
//   const week = Math.min(Math.ceil(day / 7), 4);
//   return `Wk ${week}`;
// }

// ── Fetch bills for a date range ──────────────────────────────────────────
const fetchBills = async (
  startDate: string,
  endDate: string,
): Promise<RawBill[]> => {
  const res = await fetch(
    `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=5000`,
    {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) {
    console.error(`fetchBills failed: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json?.data?.report?.allBills ?? [];
};

// ── Main export ───────────────────────────────────────────────────────────
const getHeatmapData = async (): Promise<HeatmapDataSet> => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // ── Weekly: Mon of current week → today ───────────────────────────────
  const jsDay = today.getDay(); // 0=Sun, 1=Mon...6=Sat
  // How many days back to Monday (if today is Sunday, go back 6 days)
  const diffToMonday = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  const weekStart = monday.toISOString().split("T")[0];

  // ── Monthly: 1st of current month → today ────────────────────────────
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  console.log("Heatmap fetch ranges:", {
    weekStart,
    weekEnd: todayStr,
    monthStart,
    monthEnd: todayStr,
  });

  const [weekBills, monthBills] = await Promise.all([
    fetchBills(weekStart, todayStr),
    fetchBills(monthStart, todayStr),
  ]);

  console.log("Week bills count:", weekBills.length);
  console.log("Month bills count:", monthBills.length);
  console.log("Sample bill:", weekBills || monthBills[0] || "No bills");

  // ── Build current-week heatmap ────────────────────────────────────────
  const currentWeek: HeatmapDataSet["currentWeek"] = {};
  for (const day of DAY_LABELS) {
    currentWeek[day] = {};
    for (const hour of HOUR_LABELS) {
      currentWeek[day][hour] = 0;
    }
  }

  // Current week: which days are valid (Mon=0 to today's day index)
  // diffToMonday tells us how many days have passed since Monday
  // e.g. if today is Wed (jsDay=3), diffToMonday=2, valid days = Mon(0), Tue(1), Wed(2)
  const validDayIndices = new Set<number>();
  for (let i = 0; i <= diffToMonday; i++) {
    validDayIndices.add(i); // 0=Mon, 1=Tue, ... 6=Sun in DAY_LABELS
  }

  for (const bill of weekBills) {
    if (bill.isRefunded) continue;
    if (!bill.paidAt) continue;

    const { hour, dayOfWeek, dateStr } = parseNepalHour(bill.paidAt);

    if (hour === -1) continue;

    // ── Guard: bill must fall within current week ─────────────────────────
    if (dateStr < weekStart || dateStr > todayStr) continue;

    // Convert JS day (0=Sun) to Mon-first index (Mon=0...Sun=6)
    const monFirstIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    if (!validDayIndices.has(monFirstIdx)) continue;

    const hourLabel = hourToLabel(hour);
    const dayLabel = DAY_LABELS[monFirstIdx];

    if (hourLabel && currentWeek[dayLabel] !== undefined) {
      currentWeek[dayLabel][hourLabel] += 1;
    }
  }

  // ── Build current-month heatmap ───────────────────────────────────────
  const currentMonth: HeatmapDataSet["currentMonth"] = {};
  const currentWeekNum = Math.min(Math.ceil(today.getDate() / 7), 4);

  for (const week of ["Wk 1", "Wk 2", "Wk 3", "Wk 4"]) {
    currentMonth[week] = {};
    for (const day of DAY_LABELS) {
      currentMonth[week][day] = 0;
    }
  }

  for (const bill of monthBills) {
    if (bill.isRefunded) continue;
    if (!bill.paidAt) continue;

    const { hour, dayOfWeek, dateStr } = parseNepalHour(bill.paidAt);

    if (hour === -1) continue;

    // Reconstruct date from the corrected dateStr for month/week calculation
    const billDate = new Date(dateStr + "T12:00:00"); // noon avoids DST edge cases

    // ── Guard: must be current month and year ─────────────────────────────
    if (
      billDate.getMonth() !== today.getMonth() ||
      billDate.getFullYear() !== today.getFullYear()
    )
      continue;

    const billWeekNum = Math.min(Math.ceil(billDate.getDate() / 7), 4);
    if (billWeekNum > currentWeekNum) continue;

    const weekLabel = `Wk ${billWeekNum}`;
    const dayLabel = dayOfWeekToLabel(dayOfWeek);

    if (currentMonth[weekLabel]) {
      currentMonth[weekLabel][dayLabel] += 1;
    }
  }

  console.log("Current-week heatmap:", currentWeek);
  console.log("Current-month heatmap:", currentMonth);

  return { currentWeek, currentMonth };
};

export { getHeatmapData };
