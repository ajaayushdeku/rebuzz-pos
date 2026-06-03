"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export type LoyaltyTier = "Gold" | "Silver" | "Bronze" | "Platinum" | "None";

export type TopCustomer = {
  rank: number;
  customer: string;
  numVisits: number;
  totalSpent: number;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  numberOfPurchases?: number;
};

export type TopCustomersProps = {
  topCustomers: TopCustomer[];
};

export const tierStyles: Record<LoyaltyTier, { cell: string; badge: string }> =
  {
    Gold: {
      cell: "text-yellow-800",
      badge: "bg-yellow-200",
    },
    Silver: {
      cell: "text-gray-800",
      badge: "bg-gray-200",
    },
    Bronze: {
      cell: "text-amber-800",
      badge: "bg-amber-100",
    },
    Platinum: {
      cell: "text-indigo-800",
      badge: "bg-indigo-200",
    },
    None: {
      cell: "text-gray-800",
      badge: "bg-gray-200",
    },
  };

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function TopCustomer({ topCustomers }: TopCustomersProps) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return topCustomers;
    const q = search.toLowerCase();
    return topCustomers.filter((c) => c.customer.toLowerCase().includes(q));
  }, [topCustomers, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <h1 className="font-bold text-[16px] md:text-xl">
        Top Customers & Loyalty Points
      </h1>
      <p className="text-gray-400 text-sm mt-0.5">
        Highest value contributors this month
      </p>

      {/* Search */}
      <div className="relative my-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search customer..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("customer")}
              >
                <span className="flex items-center gap-1">
                  Name {SortIcon({ colKey: "customer" })}
                </span>
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("numVisits")}
              >
                <span className="flex items-center gap-1">
                  Visits {SortIcon({ colKey: "numVisits" })}
                </span>
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("totalSpent")}
              >
                <span className="flex items-center justify-end gap-1">
                  Total Spent {SortIcon({ colKey: "totalSpent" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Loyalty Tier
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("loyaltyPoints")}
              >
                <span className="flex items-center justify-end gap-1">
                  Loyalty Points {SortIcon({ colKey: "loyaltyPoints" })}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No customers found
                </td>
              </tr>
            ) : (
              paged.map((customer, idx) => (
                <tr
                  key={customer.rank}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {customer.customer}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      {customer.numVisits}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(customer.totalSpent, currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        tierStyles[customer.loyaltyTier].badge
                      } ${tierStyles[customer.loyaltyTier].cell}`}
                    >
                      {customer.loyaltyTier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {customer.loyaltyPoints}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">
          Page {page + 1} of {totalPages} · {sorted.length} customers
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
