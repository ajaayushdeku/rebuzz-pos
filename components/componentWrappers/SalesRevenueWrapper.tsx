import TopProducts from "../dashboardComponents/salesRevenue/TopProducts";
import SalesTrendChart from "../dashboardComponents/salesRevenue/SalesTrendChart";
import SlowProducts from "../dashboardComponents/salesRevenue/SlowProducts";
import RevenueVsProfitChart from "../dashboardComponents/salesRevenue/RevenueVsProfitChart";

export function TopProductsWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  return <TopProducts startDate={startDate} endDate={endDate} />;
}

export function SlowProductsWrapper() {
  return <SlowProducts />;
}

export function RevenueVsProfitChartWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  // Chart fetches data internally via useRevenueVsProfit hook, driven by the
  // global date range passed from the page.
  return <RevenueVsProfitChart startDate={startDate} endDate={endDate} />;
}

export async function SalesTrendChartWrapper() {
  // SalesTrendChart fetches data internally via useSalesTrends hook
  return <SalesTrendChart />;
}
