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

/** Get a date string YYYY-MM-DD offset by `days` from today */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Fetch report bills for a date range, returning allBills */
async function fetchBillsInRange(
  startDate: string,
  endDate: string,
): Promise<{ customerId: string | null }[]> {
  const res = await fetch(
    `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=5000`,
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`);
  const json: RawReportResponse = await res.json();
  return json?.data?.report?.allBills ?? [];
}

/** Fetch all users (to get total count and loyalty points) */
async function fetchAllUsers(): Promise<{ loyaltyPoint: number }[]> {
  const res = await fetch(`${BASE}/business/users/roles/user`, {
    headers: await authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const json = await res.json();
  return json?.data?.users ?? [];
}

/** Return the month abbreviation (e.g. "Jan", "Feb") for a Date */
function monthAbbr(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

/** Compute start/end dates for the month containing a given Date */
function monthRange(date: Date): { start: string; end: string; label: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    label: monthAbbr(date),
  };
}

// ─────────────────────────────────────────────────────────
// getCustomerStats
// ─────────────────────────────────────────────────────────

export async function getCustomerStats(): Promise<CustomerApiResponse> {
  const startDate = offsetDate(-30);
  const endDate = offsetDate(0);

  try {
    const [usersRes, salesByItemRes, reportRes] = await Promise.all([
      fetch(`${BASE}/business/users/roles/user`, {
        headers: await authHeaders(),
        next: { revalidate: 300 },
      }),
      fetch(
        `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
        { headers: await authHeaders(), next: { revalidate: 300 } },
      ),
      fetch(
        `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=1000`,
        { headers: await authHeaders(), next: { revalidate: 300 } },
      ),
    ]);

    if (!usersRes.ok)
      throw new Error(`Failed to fetch users: ${usersRes.status}`);
    if (!salesByItemRes.ok)
      throw new Error(`Failed to fetch salesByItem: ${salesByItemRes.status}`);
    if (!reportRes.ok)
      throw new Error(`Failed to fetch report: ${reportRes.status}`);

    // Total Members
    const usersJson = await usersRes.json();
    const rawUsers: { loyaltyPoint: number }[] = usersJson?.data?.users ?? [];
    const totalMembers = rawUsers.length;

    // Points Redeemed
    const salesByItemJson = await salesByItemRes.json();
    const pointsRedeemed = salesByItemJson?.totalRedeemPoint ?? 0;

    // Active Customers (unique customerIds in bills this month)
    const reportJson: RawReportResponse = await reportRes.json();
    const bills = reportJson?.data?.report?.allBills ?? [];
    const uniqueCustomerIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) uniqueCustomerIds.add(bill.customerId);
    }
    const activeCustomers = uniqueCustomerIds.size;

    // Avg Points Per Member
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
    return mockCustomerStats;
  }
}

// ─────────────────────────────────────────────────────────
// getCustomerSegmentation
// ─────────────────────────────────────────────────────────

export async function getCustomerSegmentation(): Promise<SegmentData[]> {
  try {
    const startDate = offsetDate(-30);
    const endDate = offsetDate(0);

    // For segmentation, we consider the current month:
    //   - repeat = customers who appear in bills this month
    //   - new    = customers who DO NOT appear in bills this month
    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    const totalUsers = users.length;
    const repeatSet = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) repeatSet.add(bill.customerId);
    }

    const repeatCount = repeatSet.size;
    const newCount = totalUsers - repeatCount;

    return [
      { name: "Repeat", value: Math.max(repeatCount, 0) },
      { name: "New", value: Math.max(newCount, 0) },
    ];
  } catch {
    return mockCustomerSegmentationData;
  }
}

// ─────────────────────────────────────────────────────────
// getCustomerTrendData  —  past 6 months
// ─────────────────────────────────────────────────────────

export async function getCustomerTrendData(): Promise<CustomerTrendData[]> {
  try {
    const now = new Date();
    // Build 6 month ranges: current month + 5 previous months
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return monthRange(d);
    });

    // Fetch all 6 months' reports + users in parallel
    const billPromises = monthRanges.map((r) =>
      fetchBillsInRange(r.start, r.end),
    );
    const allResults = await Promise.all([fetchAllUsers(), ...billPromises]);

    const users = allResults[0];
    const totalUsers = users.length;

    // Each month's bills
    const monthlyBills = allResults.slice(1) as {
      customerId: string | null;
    }[][];

    // Build trend data (newest month first, then reverse to oldest -> newest)
    const trend = monthRanges.map((range, i) => {
      const bills = monthlyBills[i];
      const repeatSet = new Set<string>();
      for (const bill of bills) {
        if (bill.customerId) repeatSet.add(bill.customerId);
      }
      const repeatCount = repeatSet.size;
      const newCount = totalUsers - repeatCount;

      return {
        month: range.label,
        repeat: Math.max(repeatCount, 0),
        new: Math.max(newCount, 0),
      };
    });

    // Reverse so it's chronological (oldest → newest)
    return trend.reverse();
  } catch {
    return mockCustomerTrendData;
  }
}

// ─────────────────────────────────────────────────────────
// getLoyaltyTierData
// ─────────────────────────────────────────────────────────

export async function getLoyaltyTierData(): Promise<TierData[]> {
  try {
    const res = await fetch(`${BASE}/business/users/roles/user`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);

    const json = await res.json();
    const rawUsers: { loyaltyPoint: number }[] = json?.data?.users ?? [];

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

export async function getAtRiskCustomers(): Promise<AtRiskCustomer[]> {
  return mockAtRiskCustomers;
}

export async function getTopCustomers(): Promise<TopCustomer[]> {
  return mockTopCustomers;
}
