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
import ReferralTracking from "../dashboardComponents/customersDash/ReferralTrecking";

const getActiveLabel = (range?: string, startDate?: string): string => {
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
};

export const CustomerStatsWrapper = async ({
  startDate,
  endDate,
  range,
}: {
  startDate?: string;
  endDate?: string;
  range?: string;
}) => {
  const customerStat = await getCustomerStats(startDate, endDate);
  const activeLabel = getActiveLabel(range, startDate);
  const stats = CUSTOMER_STAT_CONFIG.map((config) => ({
    ...config,
    label: config.key === "activeCustomers" ? activeLabel : config.label,
    ...customerStat[config.key],
  }));
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mt-4">
      {stats.map(({ key, ...stat }) => (
        <CustomerStatBox key={key} {...stat} />
      ))}
    </div>
  );
};

export const CustomerSegmentationChartWrapper = async () => {
  const data = await getCustomerSegmentation();
  return <CustomerSegmentationChart data={data} />;
};

export const LoyaltyTierChartWrapper = async () => {
  const data = await getLoyaltyTierData();
  return <LoyaltyTierChart data={data} />;
};

export const CustomerTrendChartWrapper = async () => {
  const data = await getCustomerTrendData();
  return <CustomerTrendChart data={data} />;
};

export const TopCustomersWrapper = async () => {
  const data = await getTopCustomers();
  return <TopCustomer topCustomers={data} />;
};

export const AtRiskCustomerWrapper = async () => {
  const data = await getAtRiskCustomers();
  return <AtRiskCustomer riskCustomers={data} />;
};

export const ReferralTrackingWrapper = () => {
  return <ReferralTracking />;
};
