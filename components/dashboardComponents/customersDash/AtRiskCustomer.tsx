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
  History,
  Send,
  UserX,
} from "lucide-react";
import { TriangleAlert } from "lucide-react";
import CustomerHistoryModal from "@/components/dashboardComponents/customersDash/CustomerHistoryModal";
import { CardInfo, CHART_PALETTE } from "../chartCard";

type SpendingLevel = "High" | "Medium" | "Low";

export type AtRiskCustomer = {
  rank: number;
  name: string;
  spendLevel: SpendingLevel;
  /** Customer id (user _id) — used to load order history. */
  id?: string;
};

type AtRiskCustomersProps = {
  riskCustomers: AtRiskCustomer[];
};

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const spendLevelStyles: Record<SpendingLevel, { cell: string; badge: string }> =
  {
    High: {
      cell: "text-yellow-800",
      badge: "bg-yellow-200",
    },
    Medium: {
      cell: "text-blue-800",
      badge: "bg-blue-200",
    },
    Low: {
      cell: "text-gray-800",
      badge: "bg-gray-200",
    },
  };

export default function AtRiskCustomer({
  riskCustomers,
}: AtRiskCustomersProps) {
  const numCustomers = riskCustomers.length;
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [historyFor, setHistoryFor] = useState<AtRiskCustomer | null>(null);
  const pageSize = 5;

  // console.log("At Risk Customers:", riskCustomers);

  const filtered = useMemo(() => {
    if (!search) return riskCustomers;
    const q = search.toLowerCase();
    return riskCustomers.filter((c) => c.name.toLowerCase().includes(q));
  }, [riskCustomers, search]);

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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2" }}
            >
              <UserX size={16} style={{ color: "#e11d48" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                At-Risk Customers
                <CardInfo
                  heading="Reading this table"
                  label="At-Risk Customers"
                  body="Customers who have not bought in over two weeks, plus anyone enrolled who has never bought at all. The count in the corner is the whole list, not just this page. Use it to pick who to win back."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Inactive customers for over two weeks or with no purchases yet,
                requiring re-engagement
              </p>
            </div>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
          <TriangleAlert size={11} className="shrink-0" />
          <span className="whitespace-nowrap tabular-nums">
            {numCustomers} at risk
          </span>
        </span>
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

      {/* Table - horizontally scrollable on mobile */}
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
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Name {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                Alert Reason
              </th>
              <th
                className="flex items-center justify-center px-4 pb-2.5 pt-1 font-normal cursor-pointer select-none hover:text-[#3c4043]"
                onClick={() => toggleSort("spendLevel")}
              >
                <span className="flex  w-fit items-center gap-1">
                  Spending Level {SortIcon({ colKey: "spendLevel" })}
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
                  colSpan={5}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <UserX size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm text-[#3c4043]">
                      No at-risk customer found
                    </p>
                    <p className="mt-1 text-xs text-[#9aa0a6]">
                      At-risk customer data will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((customer, idx) => (
                <tr
                  key={customer.rank}
                  className="border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#f8f9fa]"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-xs text-gray-900">
                      {customer.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className=" text-xs text-gray-600 p-1 rounded-2xl inline-block px-3">
                      {`Inactive for about 2 weeks`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        spendLevelStyles[customer.spendLevel].badge
                      } ${spendLevelStyles[customer.spendLevel].cell}`}
                    >
                      {customer.spendLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center md:text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setHistoryFor(customer)}
                        disabled={!customer.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs
                  font-semibold text-blue-500 hover:text-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <History size={14} />
                        <p className="hidden md:block">View History</p>
                      </button>
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg 
                  font-semibold text-gray-400 border border-gray-300 opacity-50 cursor-not-allowed"
                      >
                        <Send size={14} />
                        <p className="hidden md:block"> Send Offer</p>
                      </button>
                    </div>
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

      <CustomerHistoryModal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        customerId={historyFor?.id}
        customerName={historyFor?.name ?? ""}
      />
    </div>
  );
}
