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
  getSalesLocations,
  getStatsData,
  getTopProducts,
  getWeeklyRevenueData,
  getWinningStats,
} from "@/services/dashboardServices/apiOverview";

import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import { DataPoint } from "@/lib/types/chart";
import WeeklyRevenueChart from "../dashboardComponents/overviewDash/WeeklyRevenueChart";
import SalesLocationChart from "../dashboardComponents/overviewDash/SalesLocationChart";
import HourlySalesTrend from "../dashboardComponents/overviewDash/HourlySalesChart";

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
    case "week":
      // Sunday of current week → today
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      break;
    case "month":
      // 1st of current month → today
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      // Jan 1 of current year → today
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
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
      // Previous week: Sunday → Saturday
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      start = new Date(currentWeekStart);
      start.setDate(currentWeekStart.getDate() - 7);
      end = new Date(currentWeekStart);
      end.setDate(currentWeekStart.getDate() - 1);
      break;
    }
    case "month":
      // Previous full month: 1st → last day
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "year":
      // Previous full year: Jan 1 → Dec 31
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear(), 0, 0);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  return [fmtLocalDate(start), fmtLocalDate(end)];
};

/** Get a human-readable label for the previous period */
const getPeriodLabel = (range: string): string => {
  switch (range) {
    case "24h":
      return "from previous day";
    case "week":
      return "from previous week";
    case "month":
      return "from previous month";
    case "year":
      return "from previous year";
    default:
      return "from previous month";
  }
};

export const OverviewStatsWrapper = async ({
  range = "month",
  startDate: customStartDate,
  endDate: customEndDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const hasCustomDates = !!customStartDate && !!customEndDate;
  const now = new Date();

  // Use a single fixed reference date to prevent date drift across calls
  if (hasCustomDates) {
    // Custom date range: fetch only the selected range, no previous comparison
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

  // Preset range: show comparison with previous period
  const periodLabel = getPeriodLabel(range);
  const [startDate, endDate] = getDateRange(range, now);
  const [prevStartDate, prevEndDate] = getPreviousDateRange(range, now);

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

    // Compute percent change; avoid division by zero
    const percent =
      prev?.value > 0
        ? Math.round(((cur.value - prev.value) / prev.value) * 100)
        : 0;

    return {
      ...config,
      ...cur,
      percent,
    };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      <OverviewStatBoxGrid stats={stats} periodLabel={periodLabel} />
    </div>
  );
};

export const WinningStatsWrapper = async () => {
  const winningStat = await getWinningStats();
  const winningStats = WINNING_STAT_CONFIG.map((config) => ({
    ...config,
    ...winningStat[config.key],
  }));

  // console.log("Winning COnfig:", winningStats);

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full my-4"
    >
      <CarouselContent className="-ml-3">
        {winningStats.map(({ key, ...stat }) => (
          <CarouselItem
            key={key}
            className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
          >
            <WinningStatBox key={key} {...stat} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
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

export async function SalesLocationChartWrapper() {
  const data = await getSalesLocations();
  return <SalesLocationChart data={data} />;
}

export async function HourlySalesTrendWrapper() {
  const data = await getHourlySalesData();

  // console.log("Hours:", data);
  return <HourlySalesTrend data={data} />;
}
