import { AtRiskCustomer } from "@/components/dashboardComponents/customersDash/AtRiskCustomer";
import { SegmentData } from "@/components/dashboardComponents/customersDash/CustomerSegmentationChart";
import { CustomerTrendData } from "@/components/dashboardComponents/customersDash/CustomerTrendChart";
import { TierData } from "@/components/dashboardComponents/customersDash/LoyaltyTierChart";
import { TopCustomer } from "@/components/dashboardComponents/customersDash/top-customer-column";
import { CustomerApiResponse } from "@/lib/dashboardstats";

import {
  mockAtRiskCustomers,
  mockCustomerSegmentationData,
  mockCustomerStats,
  mockCustomerTrendData,
  mockTierData,
  mockTopCustomers,
} from "@/lib/mockData/mock-customer-data";
import { getLoyaltyStatus } from "@/lib/types/customer";
import { authHeaders } from "../authServices/session";

export async function getCustomerStats(): Promise<CustomerApiResponse> {
  return mockCustomerStats;
}

export async function getCustomerSegmentation(): Promise<SegmentData[]> {
  // const res = await fetch("https://api/customers/segmentation", {
  //   next: { revalidate: 3600 },
  // });
  // return res.json();
  return mockCustomerSegmentationData;
}

export async function getLoyaltyTierData(): Promise<TierData[]> {
  try {
    // const { getLoyaltyStatus } = await import("@/lib/types/customer");
    // const { authHeaders } = await import("../authServices/session");

    const BASE = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${BASE}/business/users/roles/user`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

    const json = await res.json();
    const rawUsers: { loyaltyPoint: number }[] = json?.data?.users ?? [];

    // Group by loyalty tier
    const counts: Record<string, number> = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };

    for (const user of rawUsers) {
      const tier = getLoyaltyStatus(user.loyaltyPoint);
      counts[tier] = (counts[tier] ?? 0) + 1;
    }

    return [
      { tier: "Bronze", members: counts.Bronze },
      { tier: "Silver", members: counts.Silver },
      { tier: "Gold", members: counts.Gold },
      { tier: "Platinum", members: counts.Platinum },
    ];
  } catch {
    return mockTierData;
  }
}

export async function getCustomerTrendData(): Promise<CustomerTrendData[]> {
  return mockCustomerTrendData;
}
export async function getAtRiskCustomers(): Promise<AtRiskCustomer[]> {
  return mockAtRiskCustomers;
}

export async function getTopCustomers(): Promise<TopCustomer[]> {
  return mockTopCustomers;
}
