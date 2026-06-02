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
  numberOfPurchases?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]; // adjust if your backend expects different format
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
    // const startDate = offsetDate(-30);
    // const endDate = offsetDate(0);

    const now = new Date();

    const startDate = formatDate(getStartOfMonth(now));
    const endDate = formatDate(now);

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
    const startDate = offsetDate(-15);
    const endDate = offsetDate(0);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Which customer IDs were active in the last 15 days
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

    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      .toISOString()
      .split("T")[0];

    const endDate = offsetDate(0);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    const totalUsers = users.length;

    const monthCustomerMap = new Map<string, Set<string>>();

    for (const bill of bills) {
      if (!bill.customerId) continue;

      const rawDate = bill.paidAt ?? bill.createdAt;
      if (!rawDate) continue;

      const billDate = new Date(
        rawDate.includes("T") ? rawDate : rawDate.replace(" ", "T") + "+05:45",
      );

      const monthKey = `${billDate.getFullYear()}-${String(
        billDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!monthCustomerMap.has(monthKey)) {
        monthCustomerMap.set(monthKey, new Set());
      }

      monthCustomerMap.get(monthKey)!.add(bill.customerId);
    }

    return Array.from(monthCustomerMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, customerIds]) => {
        const [year, month] = monthKey.split("-");

        const monthLabel = new Date(
          Number(year),
          Number(month) - 1,
          1,
        ).toLocaleString("en-US", {
          month: "short",
        });

        const repeatCount = customerIds.size;

        return {
          month: monthLabel,
          repeat: repeatCount,
          new: totalUsers - repeatCount,
          totalCustomers: totalUsers,
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
    const lookbackStart = offsetDate(-15); // better to check further back

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(lookbackStart, todayStr),
    ]);

    // customerId -> latest bill date
    const lastVisitMap = new Map<string, Date>();

    for (const bill of bills) {
      if (!bill.customerId) continue;

      const rawDate = bill.paidAt ?? bill.createdAt;
      if (!rawDate) continue;

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

    const atRisk = users
      .map((user) => {
        const lastVisitDate = lastVisitMap.get(user._id);

        const daysSinceVisit = lastVisitDate
          ? Math.floor(
              (today.getTime() - lastVisitDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : Number.MAX_SAFE_INTEGER;

        return {
          user,
          lastVisitDate,
          daysSinceVisit,
        };
      })
      .filter(({ daysSinceVisit }) => daysSinceVisit >= 14)
      .sort((a, b) => b.daysSinceVisit - a.daysSinceVisit)
      .slice(0, 20)
      // .map(({ user, lastVisitDate }, index) => ({
      //   rank: index + 1,
      //   name: user.name || user._id,

      //   // Actual last visit date
      //   lastVisit: lastVisitDate
      //     ? lastVisitDate.toLocaleDateString("en-CA") // YYYY-MM-DD
      //     : "Never",

      //   spendLevel: toSpendLevel(user.loyaltyPoint ?? 0),
      // }));
      .map(({ user, daysSinceVisit }, index) => ({
        rank: index + 1,
        name: user.name || user._id,
        lastVisit: daysSinceVisit,
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
    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const endDate = now.toISOString().split("T")[0];

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(startDate, endDate),
    ]);

    // Spend map for THIS MONTH only
    const spendMap = new Map<string, number>();
    const activeCustomerSet = new Set<string>();

    for (const bill of bills) {
      if (!bill.customerId || bill.isRefunded) continue;

      activeCustomerSet.add(bill.customerId);

      const current = spendMap.get(bill.customerId) ?? 0;
      spendMap.set(bill.customerId, current + (bill.grandTotal ?? 0));
    }

    // Filter only active customers this month
    const activeUsers = users.filter((u) => activeCustomerSet.has(u._id));

    const ranked = activeUsers
      .map((user) => {
        const totalSpent =
          Math.round((spendMap.get(user._id) ?? 0) * 100) / 100;

        const loyaltyPoints = user.loyaltyPoint ?? 0;

        return {
          rank: 0,
          customer: user.name || user._id,
          numVisits: user.numberOfPurchases ?? 0,
          loyaltyPoints,
          totalSpent,
          loyaltyTier: getLoyaltyStatus(
            loyaltyPoints,
          ) as TopCustomer["loyaltyTier"],
        };
      })
      .sort((a, b) => {
        // primary: total spent
        if (b.totalSpent !== a.totalSpent) {
          return b.totalSpent - a.totalSpent;
        }
        // secondary: loyalty points
        return b.loyaltyPoints - a.loyaltyPoints;
      })
      .slice(0, 20)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1,
      }));

    return ranked;
  } catch (err) {
    console.error("getTopCustomers error:", err);
    return mockTopCustomers;
  }
}
