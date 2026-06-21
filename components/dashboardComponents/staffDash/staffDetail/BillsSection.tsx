"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime } from "./staffDetailHelpers";
import { useRouter } from "next/navigation";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { statusStyles, paymentMethods } from "@/lib/config/transaction";

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

interface BillsSectionProps {
  employeeId: string;
  dateRange: DateRangeValue;
}

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
  const pageSize = 5;

  useEffect(() => {
    if (!employeeId) return;

    const fetchBills = async () => {
      setLoading(true);
      setError(null);
      try {
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

  const totalPages = Math.max(1, Math.ceil(bills.length / pageSize));
  const displayBills = bills.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Receipt size={16} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Transactions / Bills
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              Loading transactions...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Receipt size={16} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Transactions / Bills
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              Unable to load data
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <button
            onClick={() => setLoading(true)}
            className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const paymentMethodsRecord = paymentMethods as Record<
    string,
    { cell: string; badge: string }
  >;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Receipt size={16} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Transactions / Bills
            </h2>
            <p className="text-[11px] text-gray-400 mt-px">
              {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </p>
          </div>
        </div>
      </div>

      {displayBills.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          No transactions found for this date range
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
                  Order ID
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Date / Time
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Invoice Name
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">
                  Customer
                </th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Payment
                </th>
                <th className="text-right pb-3 pt-3 px-4 font-medium">
                  <span className="flex items-center justify-end gap-1">
                    Total
                  </span>
                </th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayBills.map((bill, idx) => {
                const billDate = parseNepalDateTime(bill.paidAt);
                const s =
                  statusStyles[bill.isRefunded ? "refunded" : "completed"] ??
                  statusStyles["completed"];
                const p =
                  paymentMethodsRecord[bill.paymentMethod] ??
                  paymentMethodsRecord["Cash"];

                return (
                  <tr
                    key={bill._id}
                    onClick={() => router.push(`/invoices/${bill.invoiceNo}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        ORD-{bill.invoiceNo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {billDate ? (
                        <div>
                          <span className="text-sm font-medium text-gray-800 block">
                            {billDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {billDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {bill.ticketName || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {bill.generatedBy || "—"}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${p.badge} ${p.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {bill.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrencySymbol(
                        bill.grandTotal ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${s.badge} ${s.cell} text-xs font-medium px-2 py-0.5 rounded-full inline-block`}
                      >
                        {bill.isRefunded ? "refunded" : "completed"}
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
            Page {page + 1} of {totalPages} · {bills.length} transactions
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
