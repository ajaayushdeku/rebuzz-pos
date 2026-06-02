import { AtRiskCustomer } from "@/components/dashboardComponents/customersDash/AtRiskCustomer";
import { SegmentData } from "@/components/dashboardComponents/customersDash/CustomerSegmentationChart";
import { CustomerTrendData } from "@/components/dashboardComponents/customersDash/CustomerTrendChart";
import { TierData } from "@/components/dashboardComponents/customersDash/LoyaltyTierChart";
import { TopCustomer } from "@/components/dashboardComponents/customersDash/TopCustomer";
import { CustomerApiResponse } from "@/lib/dashboardstats";
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

// ── Types ─────────────────────────────────────────────────────────────────

type RawBill = {
  customerId: string | null;
  grandTotal?: number;
  paidAt?: string; // "2026-05-25 10:10:09" Nepal time
  createdAt?: string;
  isRefunded?: boolean;
};

type RawUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoint: number;
  createdAt?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function monthAbbr(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function monthRange(date: Date): { start: string; end: string; label: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  // For the current month use today, otherwise use last day of month
  const isCurrentMonth =
    date.getMonth() === new Date().getMonth() &&
    date.getFullYear() === new Date().getFullYear();
  const end = isCurrentMonth
    ? new Date()
    : new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    label: monthAbbr(date),
  };
}

// ── Shared fetchers ───────────────────────────────────────────────────────

async function fetchBillsInRange(
  startDate: string,
  endDate: string,
): Promise<RawBill[]> {
  const res = await fetch(
    `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=5000`,
    {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) {
    console.error(`fetchBillsInRange failed: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json?.data?.report?.allBills ?? [];
}

async function fetchAllUsers(): Promise<RawUser[]> {
  const res = await fetch(`${BASE}/business/users/roles/user`, {
    headers: await authHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    console.error(`fetchAllUsers failed: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json?.data?.users ?? [];
}

// ── getCustomerStats ──────────────────────────────────────────────────────

export async function getCustomerStats(): Promise<CustomerApiResponse> {
  try {
    const startDate = offsetDate(-30);
    const endDate = offsetDate(0);

    const [users, bills, salesByItemJson] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
      fetch(
        `${BASE}/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
        { headers: await authHeaders(), next: { revalidate: 300 } },
      ).then((r) => r.json()),
    ]);

    const totalMembers = users.length;

    const pointsRedeemed = salesByItemJson?.totalRedeemPoint ?? 0;

    // Active = unique customers who made at least one purchase in last 30 days
    const activeCustomerIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) activeCustomerIds.add(bill.customerId);
    }
    const activeCustomers = activeCustomerIds.size;

    const totalLoyaltyPoints = users.reduce(
      (sum, u) => sum + (u.loyaltyPoint ?? 0),
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
  } catch (err) {
    console.error("getCustomerStats error:", err);
    return mockCustomerStats;
  }
}

// ── getCustomerSegmentation ───────────────────────────────────────────────

export async function getCustomerSegmentation(): Promise<SegmentData[]> {
  try {
    const startDate = offsetDate(-30);
    const endDate = offsetDate(0);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Which customer IDs were active in the last 30 days
    const activeUserIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) activeUserIds.add(bill.customerId);
    }

    let repeatCount = 0;
    for (const user of users) {
      if (activeUserIds.has(user._id)) repeatCount++;
    }
    const newCount = users.length - repeatCount;

    return [
      { name: "Repeat", value: Math.max(repeatCount, 0) },
      { name: "New", value: Math.max(newCount, 0) },
    ];
  } catch (err) {
    console.error("getCustomerSegmentation error:", err);
    return mockCustomerSegmentationData;
  }
}

// ── getCustomerTrendData ──────────────────────────────────────────────────

export async function getCustomerTrendData(): Promise<CustomerTrendData[]> {
  try {
    const now = new Date();

    // Past 6 months — oldest first
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return monthRange(d);
    });

    const monthlyBills = await Promise.all(
      monthRanges.map((r) => fetchBillsInRange(r.start, r.end)),
    );

    // Track all customer IDs seen so far (oldest → newest)
    // to distinguish "new" vs "repeat"
    const seenCustomerIds = new Set<string>();

    return monthRanges.map((range, i) => {
      const bills = monthlyBills[i];

      const monthCustomerIds = new Set<string>();
      for (const bill of bills) {
        if (bill.customerId) monthCustomerIds.add(bill.customerId);
      }

      let newCount = 0;
      let repeatCount = 0;

      for (const cid of monthCustomerIds) {
        if (seenCustomerIds.has(cid)) {
          repeatCount++;
        } else {
          newCount++;
          seenCustomerIds.add(cid);
        }
      }

      return {
        month: range.label,
        new: newCount,
        repeat: repeatCount,
      };
    });
  } catch (err) {
    console.error("getCustomerTrendData error:", err);
    return mockCustomerTrendData;
  }
}

// ── getLoyaltyTierData ────────────────────────────────────────────────────

export async function getLoyaltyTierData(): Promise<TierData[]> {
  try {
    const users = await fetchAllUsers();

    const counts: Record<string, number> = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };

    for (const user of users) {
      const tier = getLoyaltyStatus(user.loyaltyPoint ?? 0);
      counts[tier] = (counts[tier] ?? 0) + 1;
    }

    return [
      { tier: "Bronze", members: counts.Bronze },
      { tier: "Silver", members: counts.Silver },
      { tier: "Gold", members: counts.Gold },
      { tier: "Platinum", members: counts.Platinum },
    ];
  } catch (err) {
    console.error("getLoyaltyTierData error:", err);
    return mockTierData;
  }
}

// ── getAtRiskCustomers ────────────────────────────────────────────────────

export async function getAtRiskCustomers(): Promise<AtRiskCustomer[]> {
  try {
    const today = new Date();
    const todayStr = offsetDate(0);
    // Look back 90 days to get the last visit date per customer
    const lookbackStart = offsetDate(-90);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(lookbackStart, todayStr),
    ]);

    // Build map: customerId → most recent bill date
    const lastVisitMap = new Map<string, Date>();
    for (const bill of bills) {
      if (!bill.customerId) continue;

      // Parse paidAt (Nepal time stored without tz suffix)
      const rawDate = bill.paidAt ?? bill.createdAt ?? "";
      const normalized = rawDate.includes("T")
        ? rawDate
        : rawDate.replace(" ", "T") + "+05:45";
      const billDate = new Date(normalized);

      const existing = lastVisitMap.get(bill.customerId);
      if (!existing || billDate > existing) {
        lastVisitMap.set(bill.customerId, billDate);
      }
    }

    function toSpendLevel(points: number): "High" | "Medium" | "Low" {
      if (points >= 1000) return "High";
      if (points >= 500) return "Medium";
      return "Low";
    }

    // At-risk = users who haven't visited in the last 14 days
    // or have never visited at all
    const atRisk = users
      .map((u) => {
        const lastVisitDate = lastVisitMap.get(u._id);
        const daysSinceVisit = lastVisitDate
          ? Math.floor(
              (today.getTime() - lastVisitDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999; // never visited
        return { user: u, daysSinceVisit };
      })
      .filter(({ daysSinceVisit }) => daysSinceVisit >= 14)
      .sort((a, b) => b.daysSinceVisit - a.daysSinceVisit) // most at-risk first
      .slice(0, 20)
      .map(({ user, daysSinceVisit }, idx) => ({
        rank: idx + 1,
        name: user.name || user._id,
        lastVisit: daysSinceVisit === 999 ? 90 : daysSinceVisit,
        spendLevel: toSpendLevel(user.loyaltyPoint ?? 0),
      }));

    return atRisk;
  } catch (err) {
    console.error("getAtRiskCustomers error:", err);
    return mockAtRiskCustomers;
  }
}

// ── getTopCustomers ───────────────────────────────────────────────────────

export async function getTopCustomers(): Promise<TopCustomer[]> {
  try {
    const endDate = offsetDate(0);
    const startDate = offsetDate(-365);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Aggregate spend + visits per customerId
    const statsMap = new Map<
      string,
      { totalSpent: number; numVisits: number }
    >();

    for (const bill of bills) {
      if (!bill.customerId) continue;
      const existing = statsMap.get(bill.customerId) ?? {
        totalSpent: 0,
        numVisits: 0,
      };
      existing.totalSpent += bill.grandTotal ?? 0;
      existing.numVisits += 1;
      statsMap.set(bill.customerId, existing);
    }

    const ranked = users
      .map((u) => {
        const stats = statsMap.get(u._id) ?? {
          totalSpent: 0,
          numVisits: 0,
        };
        return {
          rank: 0,
          customer: u.name || u._id,
          numVisits: stats.numVisits,
          totalSpent: Math.round(stats.totalSpent * 100) / 100,
          loyaltyTier: getLoyaltyStatus(u.loyaltyPoint ?? 0),
          loyaltyPoints: u.loyaltyPoint ?? 0,
        } as TopCustomer;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent) // sort by actual spend, not just points
      .slice(0, 20)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));

    return ranked;
  } catch (err) {
    console.error("getTopCustomers error:", err);
    return mockTopCustomers;
  }
}
