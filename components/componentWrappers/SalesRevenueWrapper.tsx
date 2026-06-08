import TopProducts from "../dashboardComponents/salesRevenue/TopProducts";
import SalesTrendChart from "../dashboardComponents/salesRevenue/SalesTrendChart";
import SlowProducts from "../dashboardComponents/salesRevenue/SlowProducts";
import RevenueVsProfitChart from "../dashboardComponents/salesRevenue/RevenueVsProfitChart";

export function TopProductsWrapper() {
  return <TopProducts />;
}

export function SlowProductsWrapper() {
  return <SlowProducts />;
}

export function RevenueVsProfitChartWrapper() {
  // Chart fetches data internally via useRevenueVsProfit hook
  // Dates are read directly from URL via useSearchParams + CalendarDateFilter
  return <RevenueVsProfitChart />;
}

export async function SalesTrendChartWrapper() {
  // SalesTrendChart fetches data internally via useSalesTrends hook
  return <SalesTrendChart />;
}
