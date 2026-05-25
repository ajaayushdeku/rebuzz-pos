import { TargetActualData } from "@/components/dashboardComponents/overviewDash/growthtracker/TargetVsActualChart";
import { YoYData } from "@/components/dashboardComponents/overviewDash/growthtracker/YearOverYearChart";
import { GrowthStatsApiResponse } from "@/lib/dashboardstats";
import {
  emptyData,
  mockGrowthStats,
  mockTargetActualData,
} from "@/lib/mockData/mock-growthtrackerdata";

export const getGrowthData = async (): Promise<GrowthStatsApiResponse> => {
  return mockGrowthStats;
};

export const getTargetActualData = async (): Promise<TargetActualData[]> => {
  return mockTargetActualData;
};

export const getYoYData = async (): Promise<YoYData[]> => {
  // const res = await fetch("https://api/revenue/yoy", {
  //   next: { revalidate: 3600 },
  // });
  // return res.json();
  // return mockYearOverYearData;
  return emptyData;
};
