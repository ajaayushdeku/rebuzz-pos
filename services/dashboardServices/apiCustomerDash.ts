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

export async function getCustomerStats(
  startDate?: string,
  endDate?: string,
): Promise<CustomerApiResponse> {
  try {
    const now = new Date();

    const defaultStart = formatDate(getStartOfMonth(now));
    const defaultEnd = formatDate(now);

    const effectiveStart = startDate ?? defaultStart;
    const effectiveEnd = endDate ?? defaultEnd;

    const [users, bills, salesByItemJson] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(effectiveStart, effectiveEnd),
      fetch(
        `${BASE}/business/report/salesByItem?startDate=${effectiveStart}&endDate=${effectiveEnd}`,
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

// ── Nepal time parser (shared) ────────────────────────────────────────────

function parseNepalDate(rawDate: string): Date | null {
  if (!rawDate) return null;
  const normalized = rawDate.includes("T")
    ? rawDate.replace("Z", "")
    : rawDate.replace(" ", "T");
  const rawHour = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "12", 10);
  let date: Date;
  if (rawHour >= 12) {
    date = new Date(normalized);
  } else {
    date = new Date(normalized + "+00:00");
    date.setMinutes(date.getMinutes() + 5 * 60 + 45);
  }
  return isNaN(date.getTime()) ? null : date;
}

function toMonthKey(rawDate: string): string | null {
  const date = parseNepalDate(rawDate);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── getCustomerSegmentation ───────────────────────────────────────────────

export async function getCustomerSegmentation(): Promise<SegmentData[]> {
  try {
    const activeStartDate = offsetDate(-15);
    const endDate = offsetDate(0);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [users, activeBills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(activeStartDate, endDate),
    ]);

    // Active = has a bill in last 15 days
    const activeUserIds = new Set<string>();
    for (const bill of activeBills) {
      if (bill.customerId) activeUserIds.add(bill.customerId);
    }

    // New = has createdAt within last 30 days
    // No createdAt → skip new classification, fall into active/inactive
    const newUserIds = new Set<string>();
    for (const user of users) {
      if (!user.createdAt) continue;
      const created = parseNepalDate(user.createdAt);
      if (created && created >= thirtyDaysAgo) {
        newUserIds.add(user._id);
      }
    }

    let newAndActiveCount = 0;
    let activeOnlyCount = 0;
    let newOnlyCount = 0;
    let inactiveCount = 0;

    for (const user of users) {
      const isActive = activeUserIds.has(user._id);
      const isNew = newUserIds.has(user._id);

      if (isNew && isActive) {
        // Created in last 30 days AND has a bill in last 15 days
        newAndActiveCount++;
      } else if (isNew) {
        // Created in last 30 days but no recent bill
        newOnlyCount++;
      } else if (isActive) {
        // Has a bill in last 15 days, not a new customer
        activeOnlyCount++;
      } else {
        // No createdAt or createdAt > 30 days ago, no recent bill
        inactiveCount++;
      }
    }

    return [
      { name: "Active", value: Math.max(activeOnlyCount, 0) },
      { name: "Inactive", value: Math.max(inactiveCount, 0) },
      { name: "New", value: Math.max(newOnlyCount, 0) },
      { name: "New & Active", value: Math.max(newAndActiveCount, 0) },
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

    // ── Step 1: Per-month active customer sets (from bills) ───────────────
    // monthActiveMap: "YYYY-MM" → Set<customerId>
    const monthActiveMap = new Map<string, Set<string>>();

    for (const bill of bills) {
      if (!bill.customerId) continue;
      const rawDate = bill.paidAt ?? bill.createdAt;
      if (!rawDate) continue;
      const monthKey = toMonthKey(rawDate);
      if (!monthKey) continue;

      if (!monthActiveMap.has(monthKey)) {
        monthActiveMap.set(monthKey, new Set());
      }
      monthActiveMap.get(monthKey)!.add(bill.customerId);
    }

    // ── Step 2: Per-month new customer sets (from createdAt only) ─────────
    // monthNewMap: "YYYY-MM" → Set<customerId>
    // Customers without createdAt are excluded from new — they go to active/inactive
    const monthNewMap = new Map<string, Set<string>>();

    for (const user of users) {
      if (!user.createdAt) continue;
      const monthKey = toMonthKey(user.createdAt);
      if (!monthKey) continue;

      if (!monthNewMap.has(monthKey)) {
        monthNewMap.set(monthKey, new Set());
      }
      monthNewMap.get(monthKey)!.add(user._id);
    }

    // ── Step 3: Build userId → createdAt monthKey lookup ─────────────────
    const userCreationMonthMap = new Map<string, string>();
    for (const user of users) {
      if (!user.createdAt) continue;
      const monthKey = toMonthKey(user.createdAt);
      if (monthKey) userCreationMonthMap.set(user._id, monthKey);
    }

    // ── Step 4: Generate all 6 month slots ───────────────────────────────
    const monthSlots: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthSlots.push(key);
    }

    // ── Step 5: Assemble per-month metrics ────────────────────────────────
    return monthSlots.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthLabel = new Date(
        Number(year),
        Number(month) - 1,
        1,
      ).toLocaleString("en-US", { month: "short" });

      const activeSet = monthActiveMap.get(monthKey) ?? new Set<string>();
      const newSet = monthNewMap.get(monthKey) ?? new Set<string>();

      // new & active = created THIS month AND has bill THIS month
      let newActive = 0;
      // new only = created THIS month but NO bill THIS month
      let newOnly = 0;

      for (const userId of newSet) {
        if (activeSet.has(userId)) {
          newActive++;
        } else {
          newOnly++;
        }
      }

      // active only = has bill THIS month AND was NOT created this month
      let activeOnly = 0;
      for (const userId of activeSet) {
        if (!newSet.has(userId)) {
          activeOnly++;
        }
      }

      // inactive = customers who existed before this month
      // (created before monthKey OR no createdAt) and have no bill this month
      let inactive = 0;
      for (const user of users) {
        const isActive = activeSet.has(user._id);
        const isNew = newSet.has(user._id); // created this month

        if (isActive || isNew) continue; // already counted above

        // Customer existed before this month if:
        // - no createdAt (legacy record — definitely pre-existing)
        // - createdAt month < this month
        const creationMonth = userCreationMonthMap.get(user._id);
        const existedBefore = !creationMonth || creationMonth < monthKey;

        if (existedBefore) inactive++;
      }

      return {
        month: monthLabel,
        active: activeOnly,
        inactive,
        new: newOnly,
        newActive,
        totalCustomers: activeOnly + inactive + newOnly + newActive,
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
    const todayStr = offsetDate(0);
    const lookbackStart = offsetDate(-15);

    const [users, bills] = await Promise.all([
      fetchAllUsers(),
      fetchBillsInRange(lookbackStart, todayStr),
    ]);

    // Customers who made at least one purchase in the last 15 days
    const activeCustomerIds = new Set<string>();
    for (const bill of bills) {
      if (bill.customerId) activeCustomerIds.add(bill.customerId);
    }

    const toSpendLevel = (points: number): "High" | "Medium" | "Low" => {
      if (points >= 1000) return "High";
      if (points >= 500) return "Medium";
      return "Low";
    };

    // Determine new customers (created in the last 30 days) — exclude from at-risk
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // At-risk = customers with no purchases in the last 15 days, excluding new customers
    const atRisk = users
      .filter((user) => {
        if (activeCustomerIds.has(user._id)) return false;
        // Exclude newly created customers (last 30 days)
        if (user.createdAt) {
          const createdDate = new Date(user.createdAt);
          if (createdDate >= thirtyDaysAgo) return false;
        }
        return true;
      })
      .slice(0, 20)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name || user._id,
        spendLevel: toSpendLevel(user.loyaltyPoint ?? 0),
      }));

    return atRisk;
  } catch (err) {
    console.error("getAtRiskCustomers error:", err);
    return mockAtRiskCustomers;
  }
}

// ── Types for purchase history API ──────────────────────────────────────────

type PurchaseHistoryItem = {
  grandTotal: number;
  paidAt?: string;
  createdAt?: string;
  isRefunded?: boolean;
};

type PurchaseHistoryResponse = {
  status: string;
  customerPurchases: PurchaseHistoryItem[];
};

// ── getTopCustomers ───────────────────────────────────────────────────────
export async function getTopCustomers(): Promise<TopCustomer[]> {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // console.log("Date:", { currentMonth, currentYear });

    const users = await fetchAllUsers();

    // Fetch purchase history for each user in parallel
    const userHistories = await Promise.all(
      users.map(async (user) => {
        try {
          const res = await fetch(
            `${BASE}/business/users/${user._id}/history`,
            {
              headers: await authHeaders(),
              next: { revalidate: 300 },
            },
          );
          if (!res.ok) return null;
          const json: PurchaseHistoryResponse = await res.json();
          return json;
        } catch {
          return null;
        }
      }),
    );

    // Calculate this month's spend & visits for each user from their history
    const spendMap = new Map<string, number>();
    const visitMap = new Map<string, number>();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const history = userHistories[i];
      if (!history?.customerPurchases?.length) continue;

      let totalSpent = 0;
      let visits = 0;

      for (const purchase of history.customerPurchases) {
        if (purchase.isRefunded) continue;

        const rawDate = purchase.paidAt ?? purchase.createdAt;
        if (!rawDate) continue;

        const purchaseDate = new Date(
          rawDate.includes("T")
            ? rawDate
            : rawDate.replace(" ", "T") + "+05:45",
        );

        // Filter for current month only
        if (
          purchaseDate.getMonth() === currentMonth &&
          purchaseDate.getFullYear() === currentYear
        ) {
          totalSpent += purchase.grandTotal ?? 0;
          visits++;
        }
      }

      if (visits > 0) {
        spendMap.set(user._id, totalSpent);
        visitMap.set(user._id, visits);
      }
    }

    // Filter only active customers this month
    const activeUsers = users.filter((u) => spendMap.has(u._id));

    const ranked = activeUsers
      .map((user) => {
        const totalSpent =
          Math.round((spendMap.get(user._id) ?? 0) * 100) / 100;
        const numVisits = visitMap.get(user._id) ?? 0;
        const loyaltyPoints = user.loyaltyPoint ?? 0;

        return {
          rank: 0,
          customer: user.name || user._id,
          numVisits,
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
