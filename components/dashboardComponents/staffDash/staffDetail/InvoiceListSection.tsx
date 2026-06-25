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
import { parseNepalDateTime } from "./staffDetailHelpers";

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

const STATUS_OPTIONS = ["all", "paid", "unpaid"];

const statusStyles: Record<string, { cell: string; badge: string }> = {
  settled: {
    cell: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  pending: {
    cell: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  unpaid: {
    cell: "text-red-600",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
  default: {
    cell: "text-gray-600",
    badge: "bg-gray-50 text-gray-700 border border-gray-200",
  },
};

function getStatusStyle(status: string) {
  const key = status?.toLowerCase();
  return statusStyles[key] ?? statusStyles.default;
}

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
  const [statusFilter, setStatusFilter] = useState("all");
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

  const paymentMethodsRecord: Record<string, { cell: string; badge: string }> =
    {
      Cash: {
        cell: "text-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      },
      Card: {
        cell: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
      },
      default: {
        cell: "text-gray-600",
        badge: "bg-gray-50 text-gray-700 border border-gray-200",
      },
    };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <FileText size={16} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Order / Invoice List
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              Loading orders/invoices...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <FileText size={16} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Order / Invoice List
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              Unable to load data
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
            className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <FileText size={16} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Order / Invoice List
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              {filteredTickets.length}{" "}
              {filteredTickets.length === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>
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
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium mr-1">
            Status:
          </span>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === status
                  ? "bg-orange-500 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {displayTickets.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          No invoices found for this date range
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                  S.No
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Invoice ID
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Date / Time
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Invoice Name
                </th>
                {/* <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Customer
                </th> */}
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Payment
                </th>
                <th className="text-right pb-3 pt-3 px-4 font-medium">Total</th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Status
                </th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Arch.
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTickets.map((ticket, idx) => {
                const s = getStatusStyle(ticket.paidStatus);
                const ticketDate = ticket.createdAt
                  ? parseNepalDateTime(ticket.createdAt)
                  : null;

                const pm = ticket.paymentMethod
                  ? (paymentMethodsRecord[ticket.paymentMethod] ??
                    paymentMethodsRecord.default)
                  : null;

                return (
                  <tr
                    key={ticket._id}
                    onClick={() => router.push(`/invoices/${ticket.invoice}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-gray-900">
                        ORD-{ticket.invoice}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {ticketDate ? (
                        <div>
                          <span className="font-medium text-gray-800 text-xs block">
                            {ticketDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {ticketDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-600">
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
                          {ticket.paymentMethod
                            ? ticket.paymentMethod.charAt(0).toUpperCase() +
                              ticket.paymentMethod.slice(1)
                            : "—"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right font-semibold text-gray-900">
                      {formatCurrencySymbol(
                        ticket.grandTotal ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${s.badge} ${s.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block capitalize`}
                      >
                        {ticket.paidStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          ticket.archivedAt
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "bg-gray-50 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {ticket.archivedAt ? "Archived" : "Unarchived"}
                      </span>
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
