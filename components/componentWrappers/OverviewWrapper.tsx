import OverviewStatBoxGrid from "../dashboardComponents/overviewDash/OverviewStatBoxGrid";
import WinningStatBox from "../dashboardComponents/overviewDash/WinningStatBox";
import RecentTransactions from "../dashboardComponents/overviewDash/RecentTransactions";
import TopItems from "../dashboardComponents/overviewDash/TopItems";

import {
  MergedSerializableConfig,
  STATS_CONFIG,
  WINNING_STAT_CONFIG,
} from "@/lib/config/dashboard";

import {
  getHourlySalesData,
  getRecentTransactions,
  getStatsData,
  getTopProducts,
  getWeeklyRevenueData,
  getWinningStats,
} from "@/services/dashboardServices/apiOverview";

import { format } from "date-fns";
import { DataPoint } from "@/lib/types/chart";
import WeeklyRevenueChart from "../dashboardComponents/overviewDash/WeeklyRevenueChart";
import HourlySalesTrend from "../dashboardComponents/overviewDash/HourlySalesChart";
import PaymentMethodsChart from "../dashboardComponents/overviewDash/PaymentMethodsChart";

/** Format date range as "MMM d – MMM d, yyyy" or "MMM d, yyyy" if same day */
function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  if (start === end) {
    return format(s, "MMM d, yyyy");
  }
  return `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
}

/** Format a Date as YYYY-MM-DD using local timezone (not UTC) */
function fmtLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convert a range key to [startDate, endDate] ISO date strings using a fixed reference date */
const getDateRange = (range: string, now: Date): [string, string] => {
  const end = fmtLocalDate(now);
  let start: Date;

  switch (range) {
    case "24h":
      // Current day start to now
      start = new Date(now);
      start.setDate(now.getDate());
      break;
    case "week": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar week: Sunday to Saturday
      // const calendarWeekStart = new Date(now);
      // calendarWeekStart.setDate(now.getDate() - now.getDay());
      // start = calendarWeekStart;
      // ── New rolling 7-day period ──
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      break;
    }
    case "month": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar month: 1st of current month
      // start = new Date(now.getFullYear(), now.getMonth(), 1);
      // ── New rolling 30-day period ──
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      break;
    }
    case "year": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Calendar year: Jan 1 of current year
      // start = new Date(now.getFullYear(), 0, 1);
      // ── New rolling 365-day period ──
      start = new Date(now);
      start.setDate(now.getDate() - 364);
      break;
    }
    default:
      // Default to 24h (today) instead of month for fresh first-load data
      start = new Date(now);
      start.setDate(now.getDate());
  }

  return [fmtLocalDate(start), end];
};

/** Convert a range key to [prevStartDate, prevEndDate] for the previous period using a fixed reference date */
const getPreviousDateRange = (range: string, now: Date): [string, string] => {
  let start: Date;
  let end: Date;

  switch (range) {
    case "24h":
      // Full previous day
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case "week": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Previous calendar week: Sunday → Saturday
      // const currentWeekStart = new Date(now);
      // currentWeekStart.setDate(now.getDate() - now.getDay());
      // start = new Date(currentWeekStart);
      // start.setDate(currentWeekStart.getDate() - 7);
      // end = new Date(currentWeekStart);
      // end.setDate(currentWeekStart.getDate() - 1);
      // ── New rolling 7-day period: immediately preceding 7 days ──
      end = new Date(now);
      end.setDate(now.getDate() - 7);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    }
    case "month": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Previous full calendar month: 1st → last day
      // start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // end = new Date(now.getFullYear(), now.getMonth(), 0);
      // ── New rolling 30-day period: immediately preceding 30 days ──
      end = new Date(now);
      end.setDate(now.getDate() - 30);
      start = new Date(end);
      start.setDate(end.getDate() - 29);
      break;
    }
    case "year": {
      // ── Previous calendar-based implementation retained for future use. ──
      // Previous full calendar year: Jan 1 → Dec 31
      // start = new Date(now.getFullYear() - 1, 0, 1);
      // end = new Date(now.getFullYear(), 0, 0);
      // ── New rolling 365-day period: immediately preceding 365 days ──
      end = new Date(now);
      end.setDate(now.getDate() - 365);
      start = new Date(end);
      start.setDate(end.getDate() - 364);
      break;
    }
    default:
      // Default to 24h (previous day) for consistency with getDateRange
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  }

  return [fmtLocalDate(start), fmtLocalDate(end)];
};

/** Get a human-readable label for the previous period */
const getPeriodLabel = (range: string): string => {
  switch (range) {
    case "24h":
      return "from yesterday";
    case "week":
      return "from previous 7 days";
    case "month":
      return "from previous 30 days";
    case "year":
      return "from previous year";
    default:
      return "from yesterday";
  }
};

export const OverviewStatsWrapper = async ({
  range = "24h",
  startDate: customStartDate,
  endDate: customEndDate,
  comparisonStartDate,
  comparisonEndDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}) => {
  const hasCustomDates = !!customStartDate && !!customEndDate;
  const hasComparisonDates = !!comparisonStartDate && !!comparisonEndDate;
  const now = new Date();

  // Use a single fixed reference date to prevent date drift across calls
  if (hasCustomDates && !hasComparisonDates) {
    // Custom date range without comparison: fetch only the selected range
    const compareType = "date";
    const currentStats = await getStatsData(
      customStartDate,
      customEndDate,
      compareType,
    );

    const stats: MergedSerializableConfig[] = STATS_CONFIG.map((config) => {
      const cur = currentStats[config.key];
      return {
        ...config,
        ...cur,
        percent: 0, // No comparison when custom dates selected
      };
    });

    return (
      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
        <OverviewStatBoxGrid stats={stats} periodLabel="" />
      </div>
    );
  }

  // Preset range or range with comparison: show comparison with previous period
  const periodLabel = getPeriodLabel(range);
  const [startDate, endDate] = getDateRange(range, now);
  const [prevStartDate, prevEndDate] = hasComparisonDates
    ? [comparisonStartDate, comparisonEndDate]
    : getPreviousDateRange(range, now);

  const currentDateRangeLabel = formatDateRange(startDate, endDate);
  const comparisonDateRangeLabel = formatDateRange(prevStartDate, prevEndDate);

  // Map filter range to the appropriate compare-sales-* API type
  const compareType =
    range === "24h" ? "date" : (range as "date" | "week" | "month" | "year");

  const currentStats = await getStatsData(startDate, endDate, compareType);
  const previousStats = await getStatsData(
    prevStartDate,
    prevEndDate,
    compareType,
  );

  const stats: MergedSerializableConfig[] = STATS_CONFIG.map((config) => {
    const cur = currentStats[config.key];
    const prev = previousStats[config.key];

    // Compute percent change
    const percent = (() => {
      if (prev?.value > 0) {
        return Math.round(((cur.value - prev.value) / prev.value) * 100);
      }
      // Previous value was 0 but current is non-zero → infinite growth
      if (prev?.value === 0 && cur.value > 0) {
        return 100;
      }
      // Both zero → no change
      return 0;
    })();

    return {
      ...config,
      ...cur,
      percent,
    };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      <OverviewStatBoxGrid
        stats={stats}
        periodLabel={periodLabel}
        comparisonDateRangeLabel={comparisonDateRangeLabel}
        currentDateRange={currentDateRangeLabel}
      />
    </div>
  );
};

export const WinningStatsWrapper = async () => {
  const winningStat = await getWinningStats();
  const winningStats = WINNING_STAT_CONFIG.map((config) => ({
    ...config,
    ...winningStat[config.key],
  }));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      {winningStats.map(({ key, ...stat }) => (
        <div key={key}>
          <WinningStatBox {...stat} />
        </div>
      ))}
    </div>
  );
};

export const TopItemsWrapper = async () => {
  const data = await getTopProducts();
  return <TopItems topProducts={data} />;
};

export const RecentTransactionWrapper = async () => {
  const data = await getRecentTransactions();
  return <RecentTransactions transactions={data} />;
};

export const WeeklyRevenueChartWrapper = async () => {
  const data = await getWeeklyRevenueData();

  const computePeakDay = (data: DataPoint[]): string => {
    return data.reduce((peak, curr) =>
      curr.revenue > peak.revenue ? curr : peak,
    ).day;
  };

  const peakDay = computePeakDay(data);

  return <WeeklyRevenueChart data={data} peakDay={peakDay} />;
};

export async function HourlySalesTrendWrapper() {
  const data = await getHourlySalesData();
  return <HourlySalesTrend data={data} />;
}
