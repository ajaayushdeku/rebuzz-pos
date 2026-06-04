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

/** Convert a range key to [startDate, endDate] ISO date strings using a fixed reference date */
const getDateRange = (range: string, now: Date): [string, string] => {
  const end = now.toISOString().split("T")[0];
  const start = new Date(now);

  switch (range) {
    case "24h":
      start.setDate(now.getDate());
      break;
    case "week":
      start.setDate(now.getDate() - 6);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return [start.toISOString().split("T")[0], end];
};

/** Convert a range key to [prevStartDate, prevEndDate] for the previous period using a fixed reference date */
const getPreviousDateRange = (range: string, now: Date): [string, string] => {
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case "24h":
      end.setDate(now.getDate() - 1);
      start.setDate(now.getDate() - 1);
      break;
    case "week":
      end.setDate(now.getDate() - 7);
      start.setDate(now.getDate() - 13);
      break;
    case "month":
      end.setMonth(now.getMonth() - 1);
      start.setMonth(now.getMonth() - 2);
      break;
    case "year":
      end.setFullYear(now.getFullYear() - 1);
      start.setFullYear(now.getFullYear() - 2);
      break;
    default:
      end.setMonth(now.getMonth() - 1);
      start.setMonth(now.getMonth() - 2);
  }

  return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
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
}: {
  range?: string;
}) => {
  const periodLabel = getPeriodLabel(range);
  // Use a single fixed reference date to prevent date drift across calls
  const now = new Date();
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
      <OverviewStatBoxGrid stats={stats} periodLabel={periodLabel} />{" "}
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

  console.log("Weekly DATA:", data);

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
