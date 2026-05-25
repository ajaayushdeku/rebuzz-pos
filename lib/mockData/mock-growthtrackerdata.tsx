import { GrowthStatsApiResponse } from "@/lib/dashboardstats";
import { TargetActualData } from "@/components/dashboardComponents/overviewDash/growthtracker/TargetVsActualChart";
import { YoYData } from "@/components/dashboardComponents/overviewDash/growthtracker/YearOverYearChart";

export const mockGrowthStats: GrowthStatsApiResponse = {
  revenue: {
    value: 124500,
    prev: 116900,
    percent: 6.4,
  },
  orders: {
    value: 1420,
    prev: 1342,
    percent: 5.8,
  },
  avgOrder: {
    value: 88.6,
    prev: 86.4,
    percent: 2.1,
  },
  customers: {
    value: 700,
    prev: 641,
    percent: 9.2,
  },
  margin: {
    value: 34.0,
    prev: 34.8,
    percent: -0.8,
  },
  refunds: {
    value: 3.1,
    prev: 3.4,
    percent: -0.3,
  },
};

export const mockTargetActualData: TargetActualData[] = [
  {
    month: "Jan",
    actual: 98000,
    target: 95000,
  },
  {
    month: "Feb",
    actual: 104000,
    target: 100000,
  },
  {
    month: "Mar",
    actual: 112000,
    target: 108000,
  },
  {
    month: "Apr",
    actual: 108000,
    target: 112000,
  },
  {
    month: "May",
    actual: 119000,
    target: 115000,
  },
  {
    month: "Jun",
    actual: 125000,
    target: 120000,
  },
  {
    month: "Jul",
    actual: 131000,
    target: 125000,
  },
  {
    month: "Aug",
    actual: 128000,
    target: 130000,
  },
  {
    month: "Sep",
    actual: 116000,
    target: 118000,
  },
  {
    month: "Oct",
    actual: 122000,
    target: 115000,
  },
  {
    month: "Nov",
    actual: 118000,
    target: 120000,
  },
  {
    month: "Dec",
    actual: 142000,
    target: 135000,
  },
];

export const emptyData: YoYData[] = [];

export const mockYearOverYearData: YoYData[] = [
  {
    month: "Jan",
    lastYear: 72000,
    thisYear: 98000,
  },
  {
    month: "Feb",
    lastYear: 78000,
    thisYear: 104000,
  },
  {
    month: "Mar",
    lastYear: 85000,
    thisYear: 112000,
  },
  {
    month: "Apr",
    lastYear: 80000,
    thisYear: 108000,
  },
  {
    month: "May",
    lastYear: 90000,
    thisYear: 119000,
  },
  {
    month: "Jun",
    lastYear: 95000,
    thisYear: 125000,
  },
  {
    month: "Jul",
    lastYear: 100000,
    thisYear: 131000,
  },
  {
    month: "Aug",
    lastYear: 97000,
    thisYear: 128000,
  },
  {
    month: "Sep",
    lastYear: 88000,
    thisYear: 116000,
  },
  {
    month: "Oct",
    lastYear: 84000,
    thisYear: 122000,
  },
  {
    month: "Nov",
    lastYear: 91000,
    thisYear: 118000,
  },
  {
    month: "Dec",
    lastYear: 110000,
    thisYear: 142000,
  },
];
