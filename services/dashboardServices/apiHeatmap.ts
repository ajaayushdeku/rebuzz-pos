import { HeatmapDataSet } from "@/components/dashboardComponents/overviewDash/heatmap/Heatmap";
import { authHeaders } from "../authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────

type RawBill = {
  paidAt: string;
  isRefunded?: boolean;
  grandTotal?: number;
};

/*
// OLD parseNepalHour — removed because Date.getHours() returns server timezone
function parseNepalHour(paidAt: string): {
  hour: number;
  dayOfWeek: number;
  dateStr: string;
} {
  if (!paidAt) return { hour: -1, dayOfWeek: -1, dateStr: "" };

  const normalized = paidAt.includes("T")
    ? paidAt.replace("Z", "")
    : paidAt.replace(" ", "T");

  const timePart = normalized.split("T")[1] ?? "";
  const rawHour = parseInt(timePart.split(":")[0], 10);
  const rawMinute = parseInt(timePart.split(":")[1], 10);

  let finalDate: Date;

  if (rawHour >= 12) {
    finalDate = new Date(normalized);
  } else {
    finalDate = new Date(normalized + "+00:00");
    finalDate.setMinutes(finalDate.getMinutes() + 5 * 60 + 45);
  }

  return {
    hour: finalDate.getHours(),
    dayOfWeek: finalDate.getDay(),
    dateStr: finalDate.toISOString().split("T")[0],
  };
}
*/

// ── Nepal hour & date extractor (timezone-safe) ──────────────────────────
// Extracts hour directly from the string; builds a correct Nepal Date for
// dayOfWeek and dateStr without relying on the server's local timezone.

function parseNepalHour(paidAt: string): {
  hour: number;
  dayOfWeek: number;
  dateStr: string;
} {
  if (!paidAt) return { hour: -1, dayOfWeek: -1, dateStr: "" };

  const timePart =
    (paidAt.includes("T") ? paidAt.split("T")[1] : paidAt.split(" ")[1]) || "";
  const [h, m] = timePart.split(":").map(Number);

  // ── Compute Nepal hour from string (no Date involved) ──────────────────
  let nepalHour: number;
  if (h >= 12) {
    nepalHour = h; // Already Nepal 24-hour time
  } else {
    // UTC time — add 5 hours 45 minutes
    nepalHour = h + 5;
    if ((m ?? 0) + 45 >= 60) nepalHour += 1;
  }

  // ── Build a proper Nepal Date for dayOfWeek and dateStr ─────────────────
  const rawDate = paidAt.includes("T")
    ? paidAt.replace("Z", "")
    : paidAt.replace(" ", "T");
  let nepalDate: Date;

  if (h >= 12) {
    // Already Nepal time
    nepalDate = new Date(rawDate + "+05:45");
  } else {
    // UTC — parse as UTC then add offset
    nepalDate = new Date(rawDate + "+00:00");
    nepalDate.setMinutes(nepalDate.getMinutes() + 5 * 60 + 45);
  }

  return {
    hour: nepalHour,
    dayOfWeek: nepalDate.getDay(), // 0=Sun...6=Sat
    dateStr: nepalDate.toISOString().split("T")[0],
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

// Civil (calendar) yyyy-mm-dd for a Date, using local getters.
// On the (UTC) server this matches the dateStr produced by parseNepalHour.
const toCivilISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
      // Always fetch fresh so newly-paid bills appear immediately.
      cache: "no-store",
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

  // ── Monthly: full Mon-aligned calendar grid for the current month ─────
  // Week 1 starts on the Monday of the week that contains the 1st, so the
  // trailing days of the previous month are included (and their sales shown).
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstJsDay = firstOfMonth.getDay(); // 0=Sun...6=Sat
  const firstDiffToMonday = firstJsDay === 0 ? 6 : firstJsDay - 1;

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstDiffToMonday);
  const gridStartStr = toCivilISO(gridStart);

  // Number of Mon-aligned weeks the month spans (typically 5).
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const weekCount = Math.ceil((firstDiffToMonday + lastOfMonth.getDate()) / 7);

  const [weekBills, monthBills] = await Promise.all([
    fetchBills(weekStart, todayStr),
    // Fetch from the grid's Monday (may be last month) through today.
    fetchBills(gridStartStr, todayStr),
  ]);

  // console.log("Week bills count:", weekBills.length);
  // console.log("Month bills count:", monthBills.length);
  // console.log("Sample bill:", weekBills || monthBills[0] || "No bills");

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
    // console.log("Parsed bill:", {
    //   paidAt: bill.paidAt,
    //   hour,
    //   dayOfWeek,
    //   dateStr,
    // });

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

  // ── Build current-month heatmap (date-aware calendar grid) ────────────
  // First tally non-refunded bills by their (Nepal) calendar date.
  const countByDate = new Map<string, number>();
  for (const bill of monthBills) {
    if (bill.isRefunded) continue;
    if (!bill.paidAt) continue;

    const { dateStr } = parseNepalHour(bill.paidAt);
    if (!dateStr) continue;

    countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1);
  }

  // Lay out the grid week-by-week starting at the grid's Monday. Each cell
  // carries its real date so the UI can label it and flag prev-month/future
  // days. Days after today are marked future (blank in the UI).
  const currentMonth: HeatmapDataSet["currentMonth"] = {};
  const cursor = new Date(gridStart);
  for (let w = 0; w < weekCount; w++) {
    const weekLabel = `Wk ${w + 1}`;
    currentMonth[weekLabel] = {};
    for (const day of DAY_LABELS) {
      const dateStr = toCivilISO(cursor);
      const isFuture = dateStr > todayStr;
      currentMonth[weekLabel][day] = {
        count: isFuture ? 0 : (countByDate.get(dateStr) ?? 0),
        date: dateStr,
        inMonth: cursor.getMonth() === today.getMonth(),
        isFuture,
      };
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // ── Per-day dates for the current week (for y-axis labels) ────────────
  const weekDates: Record<string, string> = {};
  for (let i = 0; i < DAY_LABELS.length; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates[DAY_LABELS[i]] = toCivilISO(d);
  }

  const MONTH_FULL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = MONTH_FULL[today.getMonth()];

  // console.log("Current-week heatmap:", currentWeek);
  // console.log("Current-month heatmap:", currentMonth);

  return { currentWeek, currentMonth, weekDates, monthName };
};

export { getHeatmapData };
