import { StatsApiResponse } from "../dashboardstats";
import { RawReportResponse } from "../types/report";

const mapReportToStats = (
  response: RawReportResponse,
  totalProductsSold?: number,
): StatsApiResponse => {
  const { totalSales, totalRevenue, profit } = response.data.report; // Adjust these field names based on the actual structure of RawReport
  return {
    totalSales: {
      value: totalRevenue,
      percent: 0,
    },
    totalOrders: {
      value: totalSales,
      percent: 0,
    },
    netProfit: { value: profit, percent: 0 },
    productsSold: { value: totalProductsSold ?? 0, percent: 0 },
  };
};

export default mapReportToStats;
