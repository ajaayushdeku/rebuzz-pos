import GrowthTrackCard from "../dashboardComponents/overviewDash/growthtracker/GrowthTrackCard";
import TargetVsActualChart from "../dashboardComponents/overviewDash/growthtracker/TargetVsActualChart";
import YearOverYearChart from "../dashboardComponents/overviewDash/growthtracker/YearOverYearChart";

import {
  getGrowthData,
  getTargetActualData,
  getYoYData,
} from "@/services/dashboardServices/apiGrowth";

import { GROWTH_STAT_CONFIG } from "@/lib/config/dashboard";
import GrowthByCategory from "../dashboardComponents/overviewDash/growthtracker/GrowthByCategory";

export const GrowthStatsWrapper = async () => {
  const growthStat = await getGrowthData();
  const stats = GROWTH_STAT_CONFIG.map((config) => ({
    ...config,
    value: growthStat[config.key as keyof typeof growthStat]?.value ?? 0,
    prev: growthStat[config.key as keyof typeof growthStat]?.prev ?? 0,
    percent: growthStat[config.key as keyof typeof growthStat]?.percent ?? 0,
  }));
  console.log("Growth Data:", growthStat); // Log the fetched growth data for debugging
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-3 my-4">
      {stats.map(({ key, ...stat }) => (
        <GrowthTrackCard key={key} {...stat} />
      ))}
    </div>
  );
};

export const TargetVsActualWrapper = async () => {
  const data = await getTargetActualData();
  return <TargetVsActualChart data={data} />;
};

export const YearOverYearWrapper = async () => {
  const data = await getYoYData();
  return <YearOverYearChart data={data} />;
};

export const GrowthByCategoryWrapper = () => {
  return <GrowthByCategory />;
};
