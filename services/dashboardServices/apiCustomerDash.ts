import { AtRiskCustomer } from "@/components/dashboardComponents/customersDash/AtRiskCustomer";
import { SegmentData } from "@/components/dashboardComponents/customersDash/CustomerSegmentationChart";
import { CustomerTrendData } from "@/components/dashboardComponents/customersDash/CustomerTrendChart";
import { TierData } from "@/components/dashboardComponents/customersDash/LoyaltyTierChart";
import { TopCustomer } from "@/components/dashboardComponents/customersDash/TopCustomer";
import { CustomerApiResponse } from "@/lib/dashboardstats";
import { RawReportResponse } from "@/lib/types/report";
import { getLoyaltyStatus } from "@/lib/types/customer";
import { authHeaders } from "../authServices/session";

import {
  mockAtRiskCustomers,
  mockCustomerSegmentationData,
  mockCustomerStats,
  mockCustomerTrendData,
  mockTierData,
  mockTopCustomers,
} from "@/lib/mockData/mock-customer-data";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Get a date string YYYY-MM-DD offset by `days` from today */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Return the month abbreviation (e.g. "Jan") for a Date */
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

/** Fetch all users with full RawCustomer shape */
async function fetchAllUsers(): Promise<
  {
    _id: string;
    name: string;
    loyaltyPoint: number;
  }[]
> {
  const res = await fetch(`${BASE}/business/users/roles/user`, {
    headers: await authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const json = await res.json();
  return json?.data?.users ?? [];
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

    const usersJson = await usersRes.json();
    const rawUsers: { loyaltyPoint: number }[] = usersJson?.data?.users ?? [];
    const totalMembers = rawUsers.length;

    const salesByItemJson = await salesByItemRes.json();
    const pointsRedeemed = salesByItemJson?.totalRedeemPoint ?? 0;

    const reportJson: RawReportResponse = await reportRes.json();
    const bills = reportJson?.data?.report?.allBills ?? [];
    const uniqueCustomerIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) uniqueCustomerIds.add(bill.customerId);
    }
    const activeCustomers = uniqueCustomerIds.size;

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

    // Fetch all users and current month's bills in parallel
    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Build a set of user _ids that have bills in the current month
    const activeUserIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) activeUserIds.add(bill.customerId);
    }

    // repeat = users whose _id appears in a bill this month
    // new = users whose _id does NOT appear in any bill this month
    let repeatCount = 0;
    for (const user of users) {
      if (activeUserIds.has(user._id)) repeatCount++;
    }
    const newCount = users.length - repeatCount;

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

    // Fetch bills for each month in parallel (newest first)
    const billPromises = monthRanges.map((r) =>
      fetchBillsInRange(r.start, r.end),
    );
    const monthlyBills = await Promise.all(billPromises);

    // Track the cumulative set of customerIds seen across all months
    // (oldest → newest so we can determine first-appearance month)
    // monthRanges is [current, current-1, ..., current-5]
    // Reverse to get [oldest, ..., newest]
    const reversedRanges = [...monthRanges].reverse();
    const reversedBills = [...monthlyBills].reverse();

    const allTimeCustomerIds = new Set<string>();
    const trend = reversedRanges.map((range, i) => {
      const bills = reversedBills[i];

      // Collect unique customerIds for this month
      const monthCustomerIds = new Set<string>();
      for (const bill of bills) {
        if (bill.customerId) monthCustomerIds.add(bill.customerId);
      }

      // new = first time we've seen this customerId across any prior month
      // repeat = customerId was already seen in an earlier month AND appears again this month
      let newCount = 0;
      let repeatCount = 0;
      for (const cid of monthCustomerIds) {
        if (allTimeCustomerIds.has(cid)) {
          repeatCount++;
        } else {
          newCount++;
          allTimeCustomerIds.add(cid);
        }
      }

      return {
        month: range.label,
        repeat: repeatCount,
        new: newCount,
      };
    });

    return trend;
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

// ─────────────────────────────────────────────────────────
// getAtRiskCustomers
// ─────────────────────────────────────────────────────────

export async function getAtRiskCustomers(): Promise<AtRiskCustomer[]> {
  try {
    const twoWeeksAgo = offsetDate(-14);
    const today = offsetDate(0);

    // Fetch all users and bills from the last 2 weeks in parallel
    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(twoWeeksAgo, today),
    ]);

    // Build set of customerIds active in the last 2 weeks
    const activeIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) activeIds.add(bill.customerId);
    }

    // Map loyaltyPoint to spendLevel
    function toSpendLevel(points: number): "High" | "Medium" | "Low" {
      if (points >= 1000) return "High";
      if (points >= 500) return "Medium";
      return "Low";
    }

    // At-risk = users who have NOT been active in the last 2 weeks
    const atRisk = users
      .filter((u) => !activeIds.has(u._id))
      .map((u, idx) => ({
        rank: idx + 1,
        name: u.name || u._id,
        lastVisit: 14, // minimum 14 days (they haven't visited in at least 14 days)
        spendLevel: toSpendLevel(u.loyaltyPoint),
      }));

    return atRisk;
  } catch {
    return mockAtRiskCustomers;
  }
}

// ─────────────────────────────────────────────────────────
// getTopCustomers
// ─────────────────────────────────────────────────────────

export async function getTopCustomers(): Promise<TopCustomer[]> {
  try {
    const endDate = offsetDate(0);
    const startDate = offsetDate(-365); // look back a year for total spend

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Aggregate total spent & visit count per customerId from bills
    const customerStats = new Map<
      string,
      { totalSpent: number; numVisits: number }
    >();
    for (const bill of bills) {
      if (!bill.customerId) continue;
      const stat = customerStats.get(bill.customerId) ?? {
        totalSpent: 0,
        numVisits: 0,
      };
      stat.totalSpent += (bill as { grandTotal?: number }).grandTotal ?? 0;
      stat.numVisits++;
      customerStats.set(bill.customerId, stat);
    }

    // Map users to TopCustomer, sorted by loyaltyPoints descending
    const ranked = users
      .map((u, idx) => {
        const stats = customerStats.get(u._id) ?? {
          totalSpent: 0,
          numVisits: 0,
        };
        return {
          rank: 0, // will set after sorting
          customer: u.name || u._id,
          numVisits: stats.numVisits,
          totalSpent: Math.round(stats.totalSpent * 100) / 100,
          loyaltyTier: getLoyaltyStatus(u.loyaltyPoint),
          loyaltyPoints: u.loyaltyPoint,
        } as TopCustomer;
      })
      .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
      .slice(0, 20) // top 20
      .map((c, idx) => ({ ...c, rank: idx + 1 }));

    return ranked;
  } catch {
    return mockTopCustomers;
  }
}
