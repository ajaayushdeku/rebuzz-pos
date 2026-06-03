"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { TriangleAlert } from "lucide-react";

type SpendingLevel = "High" | "Medium" | "Low";

export type AtRiskCustomer = {
  rank: number;
  name: string;
  spendLevel: SpendingLevel;
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
  const pageSize = 10;

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-bold text-[16px] mt-1 md:text-xl text-gray-900">
            At-Risk Customers
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Inactive customers ({numCustomers}) for about 2 weeks who need
            re-engagement
          </p>
        </div>
        <div className="text-yellow-600 border-yellow-500 border bg-yellow-100 flex items-center rounded-2xl px-2 py-0.5 gap-1 shrink-0">
          <TriangleAlert size={11} className="shrink-0" />
          <p className="text-[10px] md:text-[12px] font-semibold whitespace-nowrap">
            {numCustomers} at risk
          </p>
        </div>
      </div>

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

      {/* Table - horizontally scrollable on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Name {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Alert Reason
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("spendLevel")}
              >
                <span className="flex items-center gap-1">
                  Spending Level {SortIcon({ colKey: "spendLevel" })}
                </span>
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                      {customer.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="border text-sm text-gray-600 border-gray-500 p-1 rounded-2xl inline-block px-3">
                      {`Inactive for about 2 weeks`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                        spendLevelStyles[customer.spendLevel].badge
                      } ${spendLevelStyles[customer.spendLevel].cell}`}
                    >
                      {customer.spendLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg bg-blue-500
                    font-semibold text-gray-100 hover:bg-blue-600 hover:text-gray-100 border border-blue-500 transition-colors"
                    >
                      Send Offer
                    </button>
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
