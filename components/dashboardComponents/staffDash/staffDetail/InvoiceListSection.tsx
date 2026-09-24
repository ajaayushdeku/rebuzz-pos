"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useRouter } from "next/navigation";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { nepalStamp, timeAgo } from "@/lib/nepalDate";
import { CardInfo, CHART_PALETTE } from "../../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";
import StatusPill from "@/components/ui/StatusPill";
import SegmentedControl, {
  toSegmentOptions,
} from "@/components/ui/SegmentedControl";
import {
  normalizePaymentMethod,
  paymentMethodStyle,
} from "@/lib/config/transaction";

interface EnrichedTicket {
  _id: string;
  invoice: number;
  grandTotal: number;
  paidStatus: string;
  ticketTakenBy: string;
  ticketName?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  paymentMethod?: string;
  archivedAt?: string | null;
}

interface InvoiceListSectionProps {
  employeeId: string;
  dateRange: DateRangeValue;
}

const STATUS_OPTIONS = toSegmentOptions(["all", "paid", "unpaid"] as const);
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export default function InvoiceListSection({
  employeeId,
  dateRange,
}: InvoiceListSectionProps) {
  const { currency } = useCurrency();
  const router = useRouter();

  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 5;

  useEffect(() => {
    if (!employeeId) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/staff/${employeeId}/tickets?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await res.json();
        if (data?.status === "success") {
          setTickets(data.data.tickets ?? []);
        } else {
          throw new Error(data?.error || "Failed to fetch invoices");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load invoices",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // Filter by status and search query
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (t) => t.paidStatus?.toLowerCase() === statusFilter,
      );
    }

    // Search filter (by invoice number, ticket name, or customer name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          String(t.invoice).includes(q) ||
          t.ticketName?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.customerPhone?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tickets, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const displayTickets = filteredTickets.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  // const paymentMethodsRecord: Record<string, { cell: string; badge: string }> =
  //   {
  //     Cash: {
  //       cell: "text-emerald-600",
  //       badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  //     },
  //     Card: {
  //       cell: "text-blue-600",
  //       badge: "bg-blue-50 text-blue-700 border border-blue-200",
  //     },

  //     default: {
  //       cell: "text-gray-600",
  //       badge: "bg-gray-50 text-gray-700 border border-gray-200",
  //     },
  //   };

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}
            >
              <FileText size={16} style={{ color: "#ea580c" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Order / Invoice List
                <CardInfo
                  heading="Reading this table"
                  label="Order / Invoice List"
                  body="Every order this employee rang up in the date range at the top of the page. Use the status buttons to narrow it to paid, unpaid or refunded, and the search box to find one by invoice number, customer name or phone."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Loading orders/invoices…
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#9aa0a6]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}
            >
              <FileText size={16} style={{ color: "#ea580c" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Order / Invoice List
                <CardInfo
                  heading="Reading this table"
                  label="Order / Invoice List"
                  body="Every order this employee rang up in the date range at the top of the page. Use the status buttons to narrow it to paid, unpaid or refunded, and the search box to find one by invoice number, customer name or phone."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Unable to load data
              </p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-[#3c4043]">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
            className="mt-3 cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}
            >
              <FileText size={16} style={{ color: "#ea580c" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Order / Invoice List
                <CardInfo
                  heading="Reading this table"
                  label="Order / Invoice List"
                  body="Every order this employee rang up in the date range at the top of the page. Use the status buttons to narrow it to paid, unpaid or refunded, and the search box to find one by invoice number, customer name or phone."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                {`${filteredTickets.length} ${filteredTickets.length === 1 ? "order" : "orders"}`}
              </p>
            </div>
          </div>
        </div>
        <RangeBadge variant="pill" />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by invoice, name, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="h-9 w-full rounded-lg border border-[#dadce0] bg-white pl-9 pr-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <SegmentedControl
          label="Status:"
          accent="blue"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(next) => {
            setStatusFilter(next);
            setPage(0);
          }}
        />
      </div>

      {displayTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <FileText size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No order/invoice data found</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
            No invoices found for this date range
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr
                className="border-b text-[11px] tracking-wider"
                style={{
                  borderColor: CHART_PALETTE.grid,
                  color: CHART_PALETTE.axis,
                }}
              >
                <th className="text-left px-4 pb-2.5 pt-1 font-normal w-12">
                  S.No
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Invoice ID
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Date / Time
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Invoice Name
                </th>
                {/* <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Customer
                </th> */}
                <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                  Payment
                </th>
                <th className="text-right px-4 pb-2.5 pt-1 font-normal">
                  Total
                </th>
                <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                  Status
                </th>
                <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                  Arch.
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTickets.map((ticket, idx) => {
                // `createdAt` is a true UTC instant ("…Z"). The old parser
                // stripped the Z and read it as Nepal time already, so every
                // invoice showed 5h45m early. See nepalStamp.
                const stamp = nepalStamp(ticket.createdAt);

                // An unpaid ticket has no method at all — that still renders
                // as a dash. Anything present is normalised before lookup.
                const paymentM = ticket.paymentMethod
                  ? normalizePaymentMethod(ticket.paymentMethod)
                  : null;
                const pm = paymentM
                  ? paymentMethodStyle(ticket.paymentMethod)
                  : null;

                return (
                  <tr
                    key={ticket._id}
                    onClick={() => router.push(`/invoices/${ticket.invoice}`)}
                    className="border-b border-[#e8eaed] last:border-0 cursor-pointer hover:bg-[#f8f9fa] transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="font-medium text-xs block"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        ORD-{ticket.invoice}
                      </span>
                      {stamp && (
                        <span
                          className="text-[11px] "
                          style={{ color: CHART_PALETTE.subtitle }}
                        >
                          {timeAgo(stamp.instant)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {stamp ? (
                        <div>
                          <span
                            className="text-xs tracking-wide block"
                            style={{ color: CHART_PALETTE.title }}
                          >
                            {stamp.time24}
                            <span
                              className="text-[10px] font-normal"
                              style={{ color: CHART_PALETTE.subtitle }}
                            >
                              {"  "}[ {stamp.time12} ]
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {stamp.date}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td
                      className="py-3 px-4 text-[13px]"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {ticket.ticketName || "—"}
                    </td>
                    {/* <td className="py-3 px-4 text-gray-600">
                      {ticket.customerName || ticket.customerPhone || "—"}
                    </td> */}
                    <td className="py-3 px-4 text-center">
                      {pm ? (
                        <span
                          className={`${pm.badge} ${pm.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                        >
                          {paymentM ?? "—"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4 text-[13px] text-right font-medium "
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {formatCurrencySymbol(
                        ticket.grandTotal ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusPill label={ticket.paidStatus} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusPill
                        label={ticket.archivedAt ? "Archived" : "Unarchived"}
                        tone={ticket.archivedAt ? "warning" : "neutral"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
            Page {page + 1} of {totalPages} · {filteredTickets.length} invoices
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
      )}
    </div>
  );
}
