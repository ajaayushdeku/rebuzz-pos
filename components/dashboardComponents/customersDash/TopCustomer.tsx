"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  History,
  Trophy,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";
import CustomerHistoryModal from "@/components/dashboardComponents/customersDash/CustomerHistoryModal";
import { CardInfo, CHART_PALETTE } from "../chartCard";
import { useTierStyle } from "@/hooks/useLoyaltyTiers";
import type { LoyaltyTier } from "@/lib/types/customer";

export type { LoyaltyTier };

export type TopCustomer = {
  rank: number;
  customer: string;
  numVisits: number;
  totalSpent: number;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  numberOfPurchases?: number;
  /** Customer id (user _id) — used to load order history. */
  id?: string;
};

export type TopCustomersProps = {
  topCustomers: TopCustomer[];
};

/**
 * For a tier with no colour of its own — "No tier", or the render before the
 * ladder loads. There is no table of tier names here any more: the names are
 * the business's, so the colours have to come from its loyalty settings.
 */
const NEUTRAL_TIER = "bg-gray-100 text-gray-600";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function TopCustomer({ topCustomers }: TopCustomersProps) {
  const { currency } = useCurrency();
  const tierStyle = useTierStyle();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<TopCustomer | null>(null);
  const pageSize = 5;

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
    <div className="w-full overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb" }}
          >
            <Trophy size={16} style={{ color: "#d97706" }} />
          </div>
          <div className="min-w-0">
            <h3
              className="flex items-center gap-1.5 text-[15px] font-normal"
              style={{ color: CHART_PALETTE.title }}
            >
              Customer Leaderboard
              <CardInfo
                heading="Reading this table"
                label="Customer Leaderboard"
                body="Your customers ranked by what they have spent this month. Click a column heading to sort by visits, spend or points instead. Loyalty tier is the rung they sit on in loyalty settings."
              />
            </h3>
            <p
              className="mt-0.5 text-xs tracking-wide"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Highest value contributors this month
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex h-8 shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#dadce0] bg-white px-3 text-[11px] text-[#3c4043] transition-colors outline-none hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add New Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-4 mb-2 w-full ">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="h-9 w-full rounded-lg border border-[#dadce0] bg-white pl-9 pr-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3c4043]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div
        className="bg-white overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-[#e8eaed] text-[11px] text-[#5f6368]">
              <th className="text-left px-4 pb-2.5 pt-1 font-normal w-12">
                S.No
              </th>
              <th
                className="text-left px-4 pb-2.5 pt-1 font-normal cursor-pointer select-none hover:text-[#3c4043]"
                onClick={() => toggleSort("customer")}
              >
                <span className="flex items-center gap-1">
                  Name {SortIcon({ colKey: "customer" })}
                </span>
              </th>
              <th
                className="flex items-center justify-center  px-4 pb-2.5 pt-1 font-normal cursor-pointer select-none hover:text-[#3c4043]"
                onClick={() => toggleSort("numVisits")}
              >
                <span className="flex w-fit items-center justify-end gap-1">
                  Visits {SortIcon({ colKey: "numVisits" })}
                </span>
              </th>
              <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                Loyalty Tier
              </th>
              <th
                className="text-right px-4 pb-2.5 pt-1 font-normal cursor-pointer select-none hover:text-[#3c4043]"
                onClick={() => toggleSort("totalSpent")}
              >
                <span className="flex items-center justify-end gap-1">
                  Total Spent {SortIcon({ colKey: "totalSpent" })}
                </span>
              </th>

              <th
                className="text-right px-4 pb-2.5 pt-1 font-normal cursor-pointer select-none hover:text-[#3c4043]"
                onClick={() => toggleSort("loyaltyPoints")}
              >
                <span className="flex items-center justify-end gap-1">
                  Loyalty Points {SortIcon({ colKey: "loyaltyPoints" })}
                </span>
              </th>

              <th className="text-right px-4 pb-2.5 pt-1 font-normal">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <Trophy size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm text-[#3c4043]">No customer data</p>
                    <p className="mt-1 text-xs text-[#9aa0a6]">
                      Customer Leaderboard data will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((customer, idx) => (
                <tr
                  key={customer.rank}
                  className="border-b border-[#e8eaed] last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-xs text-gray-900">
                      {customer.customer}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-xs tracking-wide text-gray-900">
                      {customer.numVisits}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${(() => {
                        const style = tierStyle(customer.loyaltyTier);
                        return style
                          ? `${style.bgColor} ${style.color}`
                          : NEUTRAL_TIER;
                      })()}`}
                    >
                      {customer.loyaltyTier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-gray-900 tracking-wide">
                    {/* {formatCurrency(customer.totalSpent, currency)} */}
                    {formatCurrencySymbol(
                      customer.totalSpent,
                      currency.symbol,
                      currency.locale,
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-right font-semibold text-gray-900">
                    <span className="font-semibold text-gray-800 tracking-wide ">
                      {formatAmount(
                        customer.loyaltyPoints ?? 0,
                        currency.locale,
                      )}
                      <span className=" ml-1 text-[9px] text-gray-400">
                        pts
                      </span>
                    </span>
                  </td>

                  <td className="py-3  text-center md:text-right">
                    <button
                      onClick={() => setHistoryFor(customer)}
                      disabled={!customer.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs
                  font-semibold text-blue-500 hover:text-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <History size={14} />
                      <p className="hidden md:block"> View History</p>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium">
          Page {page + 1} of {totalPages} · {sorted.length} customers
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Add-customer modal — reused from records/customers */}
      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Order-history modal — mirrors records/customers/[id] history section */}
      <CustomerHistoryModal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        customerId={historyFor?.id}
        customerName={historyFor?.customer ?? ""}
      />
    </div>
  );
}
