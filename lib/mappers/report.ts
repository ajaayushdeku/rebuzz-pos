import { StatsApiResponse } from "../dashboardstats";
import { RawReportResponse } from "../types/report";

const mapReportToStats = (
  response: RawReportResponse,
  totalProductsSold?: number,
  netProfit?: number,
): StatsApiResponse => {
  const { totalSales, totalRevenue } = response.data.report;
  return {
    totalSales: {
      value: totalRevenue,
      percent: 0,
    },
    totalOrders: {
      value: totalSales,
      percent: 0,
    },
    netProfit: {
      value: netProfit ?? response.data.report.profit ?? 0,
      percent: 0,
    },
    productsSold: { value: totalProductsSold ?? 0, percent: 0 },
  };
};

export default mapReportToStats;
