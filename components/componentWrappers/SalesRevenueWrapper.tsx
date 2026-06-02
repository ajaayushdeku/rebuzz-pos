import {
  getRevenueVsProfitData,
  getSlowProducts,
  getTopProducts,
} from "@/services/dashboardServices/apiSalesRevenue";

import TopProducts from "../dashboardComponents/salesRevenue/TopProducts";
import SalesTrendChart from "../dashboardComponents/salesRevenue/SalesTrendChart";
import SlowProducts from "../dashboardComponents/salesRevenue/SlowProducts";
import { RevenueVsProfitChartClient } from "../dashboardComponents/salesRevenue/RevenueVsProfitChartClient";

export async function TopProductsWrapper() {
  const data = await getTopProducts();
  return <TopProducts topProducts={data} />;
}

export async function SlowProductsWrapper() {
  const data = await getSlowProducts();
  return <SlowProducts slowProducts={data} />;
}

export async function RevenueVsProfitChartWrapper() {
  const { rangeData, todayData } = await getRevenueVsProfitData("7d");
  return (
    <RevenueVsProfitChartClient initialData={rangeData} todayData={todayData} />
  );
}

export async function SalesTrendChartWrapper() {
  // SalesTrendChart now fetches data internally via useSalesTrends hook
  return <SalesTrendChart />;
}
