"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRefundAnalysis } from "@/hooks/useRefundAnalysis";
import RangeBadge from "@/components/ui/RangeBadge";
import { CHART_PALETTE, ChartCard } from "../chartCard";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

/** Header cell: quiet grey label, normal weight, clickable to sort. */
const TH =
  "px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#3c4043]";
/** Body cell: small text in the title colour. */
const TD = "px-3 py-2.5 text-xs";

function renderSortIcon(colKey: string, sortConfig: SortConfig) {
  if (sortConfig?.key === colKey) {
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
}

export default function RefundAnalysis({
  refundReasons: initialData,
  startDate,
  endDate,
}: {
  refundReasons?: {
    name: string;
    loss: number;
    invoiceNo: number;
    updatedAt: string;
    createdAt: string;
  }[];
  startDate: string;
  endDate: string;
}) {
  const { currency } = useCurrency();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Fetch data via React Query hook, driven by the global date range
  const { data: fetchedData, isFetching } = useRefundAnalysis(
    startDate,
    endDate,
  );
  const refundReasons = fetchedData ?? initialData ?? [];

  const filtered = useMemo(() => {
    if (!search) return refundReasons;
    const q = search.toLowerCase();
    return refundReasons.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || String(r.invoiceNo).includes(q),
    );
  }, [refundReasons, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key] ?? "";
      const bVal = (b as Record<string, unknown>)[sortConfig.key] ?? "";
      const aNum = typeof aVal === "number" ? aVal : parseFloat(String(aVal));
      const bNum = typeof bVal === "number" ? bVal : parseFloat(String(bVal));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === "asc") {
        return { key, direction: "desc" as const };
      }
      return { key, direction: "asc" as const };
    });
    setPage(0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ChartCard
      icon={Undo2}
      // Rose, as before: Tailwind's rose-600 / rose-200 / rose-50.
      iconColor="#e11d48"
      iconBorder="#fecdd3"
      iconBg="#fff1f2"
      title="Refund Analysis"
      info={{
        heading: "Reading this card",
        // From useRefundAnalysis: bills for the range (limit 100), refunded
        // ones kept, value = the bill's grand total.
        body: "Refunded bills from the date range at the top of the page. Value lost is the bill's full total; the refund date is when the bill was last updated. Click a row to open the bill.",
      }}
      subtitle="All the refunded bills with lost value."
      controls={<RangeBadge variant="pill" />}
      className="overflow-hidden"
    >
      {/* Search */}
      <div className="relative mb-3 w-full">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: CHART_PALETTE.subtitle }}
        />
        <input
          type="text"
          placeholder="Search refunds..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full rounded-lg border bg-white py-2 pl-8 pr-8 text-[11px] outline-none placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.title,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#9aa0a6] hover:text-[#5f6368]"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table: no zebra or shadow, hairline rows, quiet grey headings;
          horizontally scrollable on mobile. */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[580px] table-auto">
          <thead>
            <tr
              className="border-b text-left"
              style={{
                borderColor: CHART_PALETTE.grid,
                color: CHART_PALETTE.axis,
              }}
            >
              <th className="w-12 px-3 pb-2.5 pt-1 text-[11px] font-normal whitespace-nowrap">
                S.No
              </th>
              <th className={TH} onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">
                  Bill Name {renderSortIcon("name", sortConfig)}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("createdAt")}>
                <span className="flex items-center gap-1">
                  Bill Date {renderSortIcon("createdAt", sortConfig)}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("updatedAt")}>
                <span className="flex items-center gap-1">
                  Refund Date {renderSortIcon("updatedAt", sortConfig)}
                </span>
              </th>
              <th className={TH} onClick={() => toggleSort("loss")}>
                <span className="flex items-center justify-end gap-1">
                  Value Lost {renderSortIcon("loss", sortConfig)}
                </span>
              </th>
            </tr>
          </thead>

          <tbody style={{ color: CHART_PALETTE.title }}>
            {isFetching && !fetchedData ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{
                        borderColor: CHART_PALETTE.blue,
                        borderTopColor: "transparent",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: CHART_PALETTE.axis }}
                    >
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-2 text-center">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <Undo2
                        size={22}
                        style={{ color: CHART_PALETTE.subtitle }}
                      />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      No refund data
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      Refunded data will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((item, idx) => (
                <tr
                  key={item.invoiceNo}
                  onClick={() => router.push(`/invoices/${item.invoiceNo}`)}
                  // A light blue hover, so the row still reads as a link to
                  // its bill.
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-blue-50/60"
                  style={{ borderColor: CHART_PALETTE.grid }}
                >
                  <td
                    className={`${TD} tabular-nums`}
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {page * pageSize + idx + 1}
                  </td>

                  <td className={TD}>
                    {item.name}
                    <span
                      className="ml-2 tabular-nums"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      #{item.invoiceNo}
                    </span>
                  </td>

                  <td className={TD} style={{ color: CHART_PALETTE.axis }}>
                    {formatDate(item.createdAt)}
                  </td>

                  <td className={TD} style={{ color: CHART_PALETTE.axis }}>
                    {formatDate(item.updatedAt)}
                  </td>

                  {/* Money lost, so red and signed. */}
                  <td
                    className={`${TD} text-right font-medium tabular-nums text-red-600`}
                  >
                    -
                    {formatCurrencySymbol(
                      item.loss,
                      currency.symbol,
                      currency.locale,
                    )}
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
          Page {page + 1} of {totalPages} · {sorted.length} refund entries
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
    </ChartCard>
  );
}
