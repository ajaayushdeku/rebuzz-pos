import { CUSTOMER_STAT_CONFIG } from "@/lib/config/dashboard";
import {
  getAtRiskCustomers,
  getCustomerSegmentation,
  getCustomerStats,
  getCustomerTrendData,
  getLoyaltyTierData,
  getTopCustomers,
} from "@/services/dashboardServices/apiCustomerDash";
import CustomerStatBox from "../dashboardComponents/customersDash/CustomerStatBox";
import CustomerSegmentationChart from "../dashboardComponents/customersDash/CustomerSegmentationChart";
import LoyaltyTierChart from "../dashboardComponents/customersDash/LoyaltyTierChart";
import CustomerTrendChart from "../dashboardComponents/customersDash/CustomerTrendChart";
import TopCustomer from "../dashboardComponents/customersDash/TopCustomer";
import AtRiskCustomer from "../dashboardComponents/customersDash/AtRiskCustomer";

function getActiveLabel(range?: string, startDate?: string): string {
  if (!range && !startDate) return "Active This Month";
  switch (range) {
    case "24h":
      return "Active Today";
    case "week":
      return "Active This Week";
    case "month":
      return "Active This Month";
    case "year":
      return "Active This Year";
    default:
      return startDate ? "Active (Filtered)" : "Active This Month";
  }
}

export async function CustomerStatsWrapper({
  startDate,
  endDate,
  range,
}: {
  startDate?: string;
  endDate?: string;
  range?: string;
}) {
  const customerStat = await getCustomerStats(startDate, endDate);
  const activeLabel = getActiveLabel(range, startDate);
  const stats = CUSTOMER_STAT_CONFIG.map((config) => ({
    ...config,
    label: config.key === "activeCustomers" ? activeLabel : config.label,
    ...customerStat[config.key],
  }));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-4 gap-2 md:gap-3 my-4">
      {stats.map(({ key, ...stat }) => (
        <CustomerStatBox key={key} {...stat} />
      ))}
    </div>
  );
}

export async function CustomerSegmentationChartWrapper() {
  const data = await getCustomerSegmentation();
  return <CustomerSegmentationChart data={data} />;
}

export async function LoyaltyTierChartWrapper() {
  const data = await getLoyaltyTierData();
  return <LoyaltyTierChart data={data} />;
}

export async function CustomerTrendChartWrapper() {
  const data = await getCustomerTrendData();
  return <CustomerTrendChart data={data} />;
}

export async function TopCustomersWrapper() {
  const data = await getTopCustomers();
  return <TopCustomer topCustomers={data} />;
}

export async function AtRiskCustomerWrapper() {
  const data = await getAtRiskCustomers();
  return <AtRiskCustomer riskCustomers={data} />;
}
