"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Search,
  X,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { nepalStamp, timeAgo } from "@/lib/nepalDate";
import { useRouter } from "next/navigation";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import {
  normalizePaymentMethod,
  paymentMethodStyle,
} from "@/lib/config/transaction";
import { CardInfo, CHART_PALETTE } from "../../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";
import StatusPill from "@/components/ui/StatusPill";
import SegmentedControl, {
  toSegmentOptions,
} from "@/components/ui/SegmentedControl";

interface BillRecord {
  _id: string;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  paidAt: string;
  paymentMethod: string;
  isRefunded: boolean;
  ticketName?: string;
  customerId?: string | null;
  generatedBy?: string;
}

interface RecentBill {
  _id: string;
  orderId: string;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  discount: number;
  paymentMethod: string;
  paidAt: string;
  createdAt: string;
}

interface TicketDetail {
  _id?: string;
  invoice?: number;
  grandTotal?: number;
  paidStatus?: string;
  isRefunded?: boolean;
  ticketName?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  createdAt?: string;
  archivedAt?: string | null;
}

interface BillsSectionProps {
  employeeId: string;
  dateRange: DateRangeValue;
}

const STATUS_OPTIONS = toSegmentOptions([
  "all",
  "completed",
  "refunded",
] as const);
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export default function BillsSection({
  employeeId,
  dateRange,
}: BillsSectionProps) {
  const { currency } = useCurrency();
  const router = useRouter();

  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [noEmployeeAnalytics, setNoEmployeeAnalytics] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    if (!employeeId) return;

    const fetchBills = async () => {
      setLoading(true);
      setError(null);
      setNoEmployeeAnalytics(false);
      setBills([]);

      try {
        // ── 1. Try employee analytics API first ────────────────────────────────
        const eaRes = await fetch(
          `/api/employee-analytics/${employeeId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (eaRes.ok) {
          const eaData = await eaRes.json();
          const recentBills: RecentBill[] = eaData?.data?.recentBills ?? [];

          if (recentBills.length > 0) {
            // ── Enrich bills with missing data (ticketName, isRefunded/status) ──
            // Fetch individual ticket details for each bill to get name & status
            const enrichedBills: BillRecord[] = await Promise.all(
              recentBills.map(async (rb) => {
                try {
                  const ticketRes = await fetch(
                    `/api/tickets/${rb.invoiceNo}`,
                    { cache: "no-store" },
                  );
                  if (ticketRes.ok) {
                    const ticketJson = await ticketRes.json();
                    // The API returns data wrapper with Tickets array
                    const ticket: TicketDetail =
                      ticketJson?.data?.Tickets ??
                      ticketJson?.data?.ticket ??
                      ticketJson?.data?.ticket ??
                      ticketJson?.ticket ??
                      ticketJson?.data ??
                      ticketJson;

                    return {
                      _id: rb._id,
                      invoiceNo: rb.invoiceNo,
                      paidBillNo: rb.paidBillNo,
                      totalAmount: rb.totalAmount,
                      grandTotal: rb.grandTotal,
                      paidAt: rb.paidAt,
                      paymentMethod: rb.paymentMethod,
                      isRefunded:
                        ticket?.isRefunded === true ||
                        ticket?.paidStatus === "refunded"
                          ? true
                          : false,
                      ticketName: ticket?.ticketName ?? undefined,
                      customerId: null,
                      generatedBy: undefined,
                    };
                  }
                } catch {
                  // If ticket detail fetch fails, use the recent bill data as-is
                }

                // Fallback: return recent bill with defaults for missing fields
                return {
                  _id: rb._id,
                  invoiceNo: rb.invoiceNo,
                  paidBillNo: rb.paidBillNo,
                  totalAmount: rb.totalAmount,
                  grandTotal: rb.grandTotal,
                  paidAt: rb.paidAt,
                  paymentMethod: rb.paymentMethod,
                  isRefunded: false,
                  ticketName: undefined,
                  customerId: null,
                  generatedBy: undefined,
                };
              }),
            );

            setBills(enrichedBills);
            return;
          }
        }

        // ── 2. Fallback: employee has no analytics data — use staff bills API ──
        setNoEmployeeAnalytics(true);

        const res = await fetch(
          `/api/staff/bills/${employeeId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch bills");
        }

        const data = await res.json();
        if (data?.status === "success") {
          setBills(data.data.bills ?? []);
        } else {
          throw new Error(data?.error || "Failed to fetch bills");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bills");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // Filter by status and search query
  const filteredBills = useMemo(() => {
    let result = bills;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((bill) => {
        if (statusFilter === "completed") return !bill.isRefunded;
        if (statusFilter === "refunded") return bill.isRefunded;
        return true;
      });
    }

    // Search filter (by invoice number, bill number, or customer name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (bill) =>
          String(bill.invoiceNo).includes(q) ||
          String(bill.paidBillNo).includes(q) ||
          bill.generatedBy?.toLowerCase().includes(q) ||
          bill.ticketName?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [bills, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const displayBills = filteredBills.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#d5ffed", backgroundColor: "#f5fffa" }}
            >
              <Receipt size={16} style={{ color: "#24bc36" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Transactions / Bills
                <CardInfo
                  heading="Reading this table"
                  label="Transactions / Bills"
                  body="Bills this employee closed in the date range at the top of the page. Use the status buttons to narrow it, and the search box to find one by invoice number, bill number or customer name."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Loading transactions…
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
              style={{ borderColor: "#d5ffed", backgroundColor: "#f5fffa" }}
            >
              <Receipt size={16} style={{ color: "#24bc36" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Transactions / Bills
                <CardInfo
                  heading="Reading this table"
                  label="Transactions / Bills"
                  body="Bills this employee closed in the date range at the top of the page. Use the status buttons to narrow it, and the search box to find one by invoice number, bill number or customer name."
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
            onClick={() => setLoading(true)}
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
              style={{ borderColor: "#8ff59c", backgroundColor: "#f5fffa" }}
            >
              <Receipt size={16} style={{ color: "#28d23c" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Transactions / Bills
                <CardInfo
                  heading="Reading this table"
                  label="Transactions / Bills"
                  body="Bills this employee closed in the date range at the top of the page. Use the status buttons to narrow it, and the search box to find one by invoice number, bill number or customer name."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                {`${filteredBills.length} ${filteredBills.length === 1 ? "bill" : "bills"}`}
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
            placeholder="Search by invoice, bill, customer..."
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

      {displayBills.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <Receipt size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">No transaction data found</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
            No transactions found for this date range
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
                  S.No.
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Bill ID
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Order ID
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Date / Time
                </th>
                <th className="text-left px-4 pb-2.5 pt-1 font-normal">
                  Invoice Name
                </th>
                <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                  Payment
                </th>
                <th className="text-right px-4 pb-2.5 pt-1 font-normal">
                  <span className="flex items-center justify-end gap-1">
                    Total
                  </span>
                </th>
                <th className="text-center px-4 pb-2.5 pt-1 font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayBills.map((bill, idx) => {
                // Read as Nepal time on every machine; see nepalStamp.
                const stamp = nepalStamp(bill.paidAt);
                // Normalise before indexing — the raw value is inconsistently
                // cased ("cash", "Qr Payment"), which missed the lookup and
                // fell back to grey. The key is also the display label.
                const paymentM = normalizePaymentMethod(bill.paymentMethod);
                const p = paymentMethodStyle(bill.paymentMethod);
                return (
                  <tr
                    key={bill._id}
                    onClick={() => router.push(`/invoices/${bill.invoiceNo}`)}
                    className="border-b border-[#e8eaed] last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="font-medium text-xs  block"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        BILL-{bill.paidBillNo}
                      </span>
                      {stamp && (
                        <span className="text-[11px] font-normal text-gray-400">
                          {timeAgo(stamp.instant)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="font-medium text-xs"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        ORD-{bill.invoiceNo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {stamp ? (
                        <div>
                          <span
                            className=" text-xs tracking-wide block"
                            style={{ color: CHART_PALETTE.title }}
                          >
                            {stamp.time24}
                            <span
                              className="text-[10px] font-normal "
                              style={{ color: CHART_PALETTE.subtitle }}
                            >
                              {"  "}[ {stamp.time12} ]
                            </span>
                          </span>
                          <span
                            className="text-[11px] "
                            style={{ color: CHART_PALETTE.subtitle }}
                          >
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
                      {bill.ticketName || "—"}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {paymentM}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-[13px] text-right font-medium "
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {formatCurrencySymbol(
                        bill.grandTotal ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusPill
                        label={bill.isRefunded ? "Refunded" : "Completed"}
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
            Page {page + 1} of {totalPages} · {filteredBills.length}{" "}
            transactions
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
