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
import { ChartCard } from "../../chartCard";
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

/**
 * The card, in whichever of its three states.
 *
 * `ChartCard` draws the header, so the icon tile, the title, the ⓘ and the
 * subtitle are no longer pasted into each of the three returns — and the
 * range badge now shows while loading and on an error too, where it had been
 * dropped even though those states describe the same ranged data.
 */
function Card({
  subtitle,
  children,
}: {
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ChartCard
      icon={FileText}
      iconColor="#0c99ea"
      iconBorder="#aadbfe"
      iconBg="#edf6ff"
      title="Order / Invoice List"
      info={{
        heading: "Reading this table",
        body: "Every order this employee rang up in the date range at the top of the page. Use the status buttons to narrow it to paid, unpaid or refunded, and the search box to find one by invoice number, customer name or phone.",
      }}
      subtitle={subtitle}
      buttons={<RangeBadge variant="pill" />}
    >
      {children}
    </ChartCard>
  );
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
  //       cell: "text-emerald-600 dark:text-emerald-400",
  //       badge: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300",
  //     },
  //     Card: {
  //       cell: "text-blue-600 dark:text-[#7ba2e3]",
  //       badge: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-400/10 dark:border-blue-400/25 dark:text-[#a8c4ee]",
  //     },

  //     default: {
  //       cell: "text-gray-600 dark:text-[#a9b4c7]",
  //       badge: "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-white/5 dark:border-white/15 dark:text-[#c3ccdc]",
  //     },
  //   };

  if (loading) {
    return (
      <Card subtitle="Loading orders/invoices…">
        <div className="flex items-center justify-center py-12">
          <Loader2
            size={20}
            className="animate-spin text-[#9aa0a6] dark:text-[#9aa6bd]"
          />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card subtitle="Unable to load data">
        <div className="text-center py-8">
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
            className="mt-3 cursor-pointer rounded-full border border-[#dadce0] bg-white dark:bg-white/5 px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:text-[#e8ecf4] dark:hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      subtitle={`${filteredTickets.length} ${
        filteredTickets.length === 1 ? "order" : "orders"
      }`}
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-col justify-between sm:flex-row items-end sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]"
          />
          <input
            type="text"
            placeholder="Search by invoice, name, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="h-9 w-full rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 pl-9 pr-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/15"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#7b869b]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="hidden sm:block mx-1 h-7 w-px bg-[#dadce0] dark:bg-white/40" />

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
          showText={true}
        />
      </div>

      {displayTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <FileText size={24} className="text-gray-500 dark:text-[#9aa6bd]" />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No order/invoice data found
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            No invoices found for this date range
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full table-fixed text-sm min-w-[1010px]">
            {/* `table-fixed` with declared widths: auto layout sized the columns
                from whatever rows were on screen, so filtering, paging or a longer
                name moved them. Invoice Name takes the slack. */}
            <colgroup>
              <col className="w-14" />
              <col className="w-32" />
              <col className="w-40" />
              <col />
              <col className="w-28" />
              <col className="w-38" />
              <col className="w-28" />
              <col className="w-30" />
            </colgroup>
            <thead>
              <tr className="border-b text-[11px] tracking-wider border-[#e8eaed] dark:border-white/10 text-[#5f6368] dark:text-[#a9b4c7]">
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
                    className="border-b border-[#e8eaed] last:border-0 cursor-pointer hover:bg-[#f8f9fa] transition-colors dark:border-white/10 dark:hover:bg-white/10"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs dark:text-[#7b869b]">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-xs block text-[#3c4043] dark:text-[#e8ecf4]">
                        ORD-{ticket.invoice}
                      </span>
                      {stamp && (
                        <span className="text-[11px]  text-[#9aa0a6] dark:text-[#9aa6bd]">
                          {timeAgo(stamp.instant)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {stamp ? (
                        <div>
                          <span className="text-xs tracking-wide block text-[#3c4043] dark:text-[#e8ecf4]">
                            {stamp.time24}
                            <span className="text-[10px] font-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
                              {"  "}[ {stamp.time12} ]
                            </span>
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-[#7b869b]">
                            {stamp.date}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-[#7b869b]">
                          —
                        </span>
                      )}
                    </td>

                    <td
                      className="truncate py-3 px-4 text-[13px] text-[#3c4043] dark:text-[#e8ecf4]"
                      title={ticket.ticketName || undefined}
                    >
                      {ticket.ticketName || "—"}
                    </td>
                    {/* <td className="py-3 px-4 text-gray-600 dark:text-[#a9b4c7]">
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
                        <span className="text-gray-400 dark:text-[#7b869b]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-right font-medium  text-[#3c4043] dark:text-[#e8ecf4]">
                      {formatCurrencySymbol(
                        ticket.grandTotal ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusPill label={ticket.paidStatus} />
                    </td>

                    <td className="py-3 px-4 text-center ">
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
              page === 0
                ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span className="text-[10px] sm:text-xs text-gray-400 font-medium dark:text-[#7b869b]">
            Page {page + 1} of {totalPages} · {filteredTickets.length} invoices
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
              page >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
}
