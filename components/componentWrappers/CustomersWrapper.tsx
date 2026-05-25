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

export async function CustomerStatsWrapper() {
  const customerStat = await getCustomerStats();
  const stats = CUSTOMER_STAT_CONFIG.map((config) => ({
    ...config,
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
