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
  { name: "Repeat", value: 1020 },
  { name: "New", value: 400 },
];

export const mockCustomerStats: CustomerApiResponse = {
  totalMembers: { value: 50 },
  activeCustomers: { value: 100 },
  pointsRedeemed: { value: 5000 },
  pointsPerMember: { value: 120 },
};
export const mockCustomerTrendData: CustomerTrendData[] = [
  { month: "Sep", repeat: 150, new: 55 },
  { month: "Oct", repeat: 160, new: 70 },
  { month: "Nov", repeat: 162, new: 58 },
  { month: "Dec", repeat: 170, new: 125 },
  { month: "Jan", repeat: 175, new: 100 },
  { month: "Feb", repeat: 210, new: 85 },
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
