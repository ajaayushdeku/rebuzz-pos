import { AtRiskCustomer } from "@/components/dashboardComponents/customersDash/AtRiskCustomer";
import { SegmentData } from "@/components/dashboardComponents/customersDash/CustomerSegmentationChart";
import { CustomerTrendData } from "@/components/dashboardComponents/customersDash/CustomerTrendChart";
import { TierData } from "@/components/dashboardComponents/customersDash/LoyaltyTierChart";
import { TopCustomer } from "@/components/dashboardComponents/customersDash/top-customer-column";
import { CustomerApiResponse } from "@/lib/dashboardstats";
import { RawReportResponse } from "@/lib/types/report";

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

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getCustomerStats(): Promise<CustomerApiResponse> {
  const today = new Date();
  const monthStart = new Date(today);
  monthStart.setDate(today.getDate() - 30);

  const startDate = monthStart.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  try {
    // Fetch all data in parallel
    const [usersRes, salesByItemRes, reportRes] = await Promise.all([
      fetch(`${BASE}/business/users/roles/user`, {
        headers: await authHeaders(),
        next: { revalidate: 300 },
      }),
      fetch(
        `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: await authHeaders(),
          next: { revalidate: 300 },
        },
      ),
      fetch(
        `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=1000`,
        {
          headers: await authHeaders(),
          next: { revalidate: 300 },
        },
      ),
    ]);

    if (!usersRes.ok)
      throw new Error(`Failed to fetch users: ${usersRes.status}`);
    if (!salesByItemRes.ok)
      throw new Error(
        `Failed to fetch sales by item: ${salesByItemRes.status}`,
      );
    if (!reportRes.ok)
      throw new Error(`Failed to fetch report: ${reportRes.status}`);

    // --- Total Members ---
    const usersJson = await usersRes.json();
    const rawUsers: { loyaltyPoint: number }[] = usersJson?.data?.users ?? [];
    const totalMembers = rawUsers.length;

    // --- Total Points Redeemed (from salesByItem) ---
    const salesByItemJson = await salesByItemRes.json();
    const pointsRedeemed = salesByItemJson?.totalRedeemPoint ?? 0;

    // --- Active Customers This Month (unique customerIds from bills) ---
    const reportJson: RawReportResponse = await reportRes.json();
    const bills = reportJson?.data?.report?.allBills ?? [];
    const uniqueCustomerIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) {
        uniqueCustomerIds.add(bill.customerId);
      }
    }
    const activeCustomers = uniqueCustomerIds.size;

    // --- Avg Points Per Member ---
    const totalLoyaltyPoints = rawUsers.reduce(
      (sum, user) => sum + (user.loyaltyPoint ?? 0),
      0,
    );
    const pointsPerMember =
      totalMembers > 0
        ? Math.round((totalLoyaltyPoints / totalMembers) * 100) / 100
        : 0;

    return {
      totalMembers: { value: totalMembers },
      activeCustomers: { value: activeCustomers },
      pointsRedeemed: { value: pointsRedeemed },
      pointsPerMember: { value: pointsPerMember },
    };
  } catch {
    // Fallback to mock data on failure
    return mockCustomerStats;
  }
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
