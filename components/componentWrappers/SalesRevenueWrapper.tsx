import TopProducts from "../dashboardComponents/salesRevenue/TopProducts";
import SalesTrendChart from "../dashboardComponents/salesRevenue/SalesTrendChart";
import SlowProducts from "../dashboardComponents/salesRevenue/SlowProducts";
import RevenueVsProfitChart from "../dashboardComponents/salesRevenue/RevenueVsProfitChart";
import PeakHoursAnalysis from "../dashboardComponents/salesRevenue/PeakHoursAnalysis";
import PeakDaysAnalysis from "../dashboardComponents/salesRevenue/PeakDaysAnalysis";
import {
  getPeakHoursData,
  getPeakDaysData,
} from "@/services/dashboardServices/apiSalesRevenue";
import ForecastCard from "../dashboardComponents/salesRevenue/ForecastCard";
import { mockForecastData } from "@/lib/mockData/mock-forecast-data";
import TargetTrackerCard from "../dashboardComponents/salesRevenue/TargetTrackerCard";
import CampaignAnalysis from "../dashboardComponents/salesRevenue/CampaignAnalysis";
import PriceChangeImpact from "../dashboardComponents/salesRevenue/PriceChangeImpact";
import TimeWiseProductAnalysis from "../dashboardComponents/salesRevenue/TimeWiseProductAnalysis";
import SalesRecommendationsAlerts from "../dashboardComponents/salesRevenue/SalesRecommendationsAlerts";
import {
  mockCampaignAnalysis,
  mockPriceChangeImpact,
} from "@/lib/mockData/mockInsightData";

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

export async function PeakHoursAnalysisWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const data = await getPeakHoursData(startDate, endDate);
  return <PeakHoursAnalysis data={data} />;
}

export async function PeakDaysAnalysisWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const data = await getPeakDaysData(startDate, endDate);
  return <PeakDaysAnalysis data={data} />;
}

export function ForecastCardWrapper() {
  return <ForecastCard data={mockForecastData} />;
}

export function TargetTrackerWrapper() {
  // Self-contained: fetches current-period revenue client-side and reads
  // targets from IndexedDB. Does NOT use the dashboard's global date filter.
  return <TargetTrackerCard />;
}

export function CampaignAnalysisWrapper() {
  return <CampaignAnalysis data={mockCampaignAnalysis} />;
}

export function PriceChangeImpactWrapper() {
  return <PriceChangeImpact data={mockPriceChangeImpact} />;
}

export function TimeWiseProductAnalysisWrapper({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  // Fetches transactions for the global date range client-side and buckets
  // them into time-of-day windows.
  return <TimeWiseProductAnalysis startDate={startDate} endDate={endDate} />;
}

export function SalesRecommendationsAlertsWrapper() {
  return <SalesRecommendationsAlerts />;
}
