import { AtRiskCustomer } from "@/components/dashboardComponents/customersDash/AtRiskCustomer";
import { SegmentData } from "@/components/dashboardComponents/customersDash/CustomerSegmentationChart";
import { CustomerTrendData } from "@/components/dashboardComponents/customersDash/CustomerTrendChart";
import { TierData } from "@/components/dashboardComponents/customersDash/LoyaltyTierChart";
import { TopCustomer } from "@/components/dashboardComponents/customersDash/TopCustomer";
import { CustomerApiResponse } from "@/lib/dashboardstats";

export const mockTierData: TierData[] = [
  { tier: "Bronze", members: 480 },
  { tier: "Silver", members: 220 },
  { tier: "Gold", members: 112 },
  { tier: "Platinum", members: 30 },
];

export const mockCustomerSegmentationData: SegmentData[] = [
  { name: "Active", value: 1020 },
  { name: "Inactive", value: 400 },
];

export const mockCustomerStats: CustomerApiResponse = {
  totalMembers: { value: 50 },
  activeCustomers: { value: 100 },
  pointsRedeemed: { value: 5000 },
  pointsPerMember: { value: 120 },
};
export const mockCustomerTrendData: CustomerTrendData[] = [
  { month: "Sep", active: 150, inactive: 55 },
  { month: "Oct", active: 160, inactive: 70 },
  { month: "Nov", active: 162, inactive: 58 },
  { month: "Dec", active: 170, inactive: 125 },
  { month: "Jan", active: 175, inactive: 100 },
  { month: "Feb", active: 210, inactive: 85 },
];

export const mockTopCustomers: TopCustomer[] = [
  {
    rank: 1,
    customer: "Lenny",
    numVisits: 11,
    totalSpent: 60,
    loyaltyTier: "Gold",
    loyaltyPoints: 60,
  },
  {
    rank: 2,
    customer: "Sadie Adler",
    numVisits: 10,
    totalSpent: 50,
    loyaltyTier: "Gold",
    loyaltyPoints: 50,
  },
  {
    rank: 3,
    customer: "Uncle",
    numVisits: 5,
    totalSpent: 30,
    loyaltyTier: "Silver",
    loyaltyPoints: 30,
  },
];

export const mockAtRiskCustomers: AtRiskCustomer[] = [
  {
    rank: 1,
    name: "Mary Linton",
    spendLevel: "High",
  },
  {
    rank: 2,
    name: "Strauss",
    spendLevel: "Medium",
  },
];
