import GrowthTrackCard from "../dashboardComponents/overviewDash/growthtracker/GrowthTrackCard";
import TargetVsActualChart from "../dashboardComponents/overviewDash/growthtracker/TargetVsActualChart";
import YearOverYearChart from "../dashboardComponents/overviewDash/growthtracker/YearOverYearChart";

import {
  getGrowthData,
  getGrowthPeriodLabels,
  getTargetActualData,
  getYoYData,
} from "@/services/dashboardServices/apiGrowth";

import { GROWTH_STAT_CONFIG } from "@/lib/config/dashboard";
import GrowthByCategory from "../dashboardComponents/overviewDash/growthtracker/GrowthByCategory";
import {
  STAT_ROW,
  STAT_ROW_ITEM,
} from "../dashboardComponents/overviewDash/statRow";

export const GrowthStatsWrapper = async () => {
  const growthStat = await getGrowthData();
  const period = getGrowthPeriodLabels();
  const stats = GROWTH_STAT_CONFIG.map((config) => ({
    ...config,
    value: growthStat[config.key as keyof typeof growthStat]?.value ?? 0,
    prev: growthStat[config.key as keyof typeof growthStat]?.prev ?? 0,
    percent: growthStat[config.key as keyof typeof growthStat]?.percent ?? 0,
  }));
  // console.log("Growth Data:", growthStat); // Log the fetched growth data for debugging
  return (
    <div className={STAT_ROW}>
      {stats.map(({ key, ...stat }) => (
        <div  key={key} className={STAT_ROW_ITEM}>
          {" "}
          <GrowthTrackCard
            key={key}
            {...stat}
            currentLabel={period.current}
            previousLabel={period.previous}
          />
        </div>
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
