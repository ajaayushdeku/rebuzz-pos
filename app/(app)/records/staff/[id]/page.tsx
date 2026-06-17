"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  ShoppingCart,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

type StaffOverview = {
  name: string;
  totalSales: number;
  totalRevenue: number;
  avgTime: string;
};

type ShiftSummary = {
  shiftId?: string;
  employee?: string;
  overAllPayIn?: number;
  overAllPayOut?: number;
  overallTransaction?: number;
  openingTime?: string;
  closingTIme?: string;
  payIn?: number;
  payOut?: number;
  totalSale?: number;
  cashSale?: number;
  onlineSale?: number;
  openingCash?: number;
  closingCash?: number;
  expectedAmount?: number;
  difference?: number;
  billImages?: string[];
};

type ShiftDetailTransaction = {
  _id: string;
  transactionAmount: number;
  transactionType: string;
  note: string;
  paymentMethod?: string;
  transactionTime: string;
  invoiceNo?: number;
  billImages?: string[];
  isSplitPayment?: boolean;
  cashAmount?: number;
  qrAmount?: number;
};

type ShiftDetail = {
  openingCash: number;
  closingCash: number;
  openingTime: string;
  closingTime: string;
  employeeName: string;
  transactions: ShiftDetailTransaction[];
};

type BillItem = {
  _id: string;
  orderId: string;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  paidAt: string;
};

type EmployeeData = {
  _id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  bills: BillItem[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(1);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function parseNepalDateTime(raw: string): Date | null {
  if (!raw) return null;
  // Handle epoch string (milliseconds)
  if (/^\d{13}$/.test(raw)) {
    const d = new Date(Number(raw));
    return isNaN(d.getTime()) ? null : d;
  }
  const normalized = raw.includes("T")
    ? raw.replace("Z", "")
    : raw.replace(" ", "T");
  const rawHour = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "12", 10);
  let date: Date;
  if (rawHour >= 12) {
    date = new Date(normalized);
  } else {
    date = new Date(normalized + "+00:00");
    date.setMinutes(date.getMinutes() + 5 * 60 + 45);
  }
  return isNaN(date.getTime()) ? null : date;
}

const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const { currency } = useCurrency();

  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(true);

  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [shiftDetail, setShiftDetail] = useState<ShiftDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [shiftPage, setShiftPage] = useState(0);
  const [billPage, setBillPage] = useState(0);
  const pageSize = 10;

  // ── Fetch staff overview + bills ────────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    const fetchData = async () => {
      setLoading(true);
      setBillLoading(true);
      try {
        const res = await fetch(
          `/api/staff/sales-by-employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        const emp: EmployeeData = json?.data?.employeeData;
        if (emp) {
          setOverview({
            name: emp.name,
            totalSales: emp.totalSales ?? 0,
            totalRevenue: emp.totalRevenue ?? 0,
            avgTime: "—",
          });
          setBills(emp.bills ?? []);
        }
      } catch {
        toast.error("Failed to load staff data");
      } finally {
        setLoading(false);
        setBillLoading(false);
      }
    };
    fetchData();
  }, [employeeId, startDate, endDate]);

  // ── Fetch shifts ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    const fetchShifts = async () => {
      setShiftLoading(true);
      try {
        const res = await fetch(
          `/api/staff/${employeeId}/shifts?startDate=${startDate}&endDate=${endDate}`,
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setShifts(json?.data ?? []);
      } catch {
        toast.error("Failed to load shifts");
      } finally {
        setShiftLoading(false);
      }
    };
    fetchShifts();
  }, [employeeId, startDate, endDate]);

  // ── Fetch shift detail ──────────────────────────────────────────────────

  const fetchShiftDetail = async (shiftId: string) => {
    if (expandedShift === shiftId) {
      setExpandedShift(null);
      setShiftDetail(null);
      return;
    }
    setExpandedShift(shiftId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/staff/shift/${shiftId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const details: ShiftDetail[] = json?.data?.shiftDetails ?? [];
      setShiftDetail(details[0] ?? null);
    } catch {
      toast.error("Failed to load shift details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────

  const overallShift = shifts.find((s) => s.employee);
  const shiftList = shifts.filter((s) => s.shiftId);

  const totalPayIn =
    overallShift?.overAllPayIn ??
    shiftList.reduce((sum, s) => sum + (s.payIn ?? 0), 0);
  const totalPayOut =
    overallShift?.overAllPayOut ??
    shiftList.reduce((sum, s) => sum + (s.payOut ?? 0), 0);

  const shiftPages = Math.max(1, Math.ceil(shiftList.length / pageSize));
  const pagedShifts = shiftList.slice(
    shiftPage * pageSize,
    (shiftPage + 1) * pageSize,
  );

  const billPages = Math.max(1, Math.ceil(bills.length / pageSize));
  const pagedBills = bills.slice(
    billPage * pageSize,
    (billPage + 1) * pageSize,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-gray-500">Loading staff...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/staff")}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {overview?.name?.charAt(0)?.toUpperCase() ?? "S"}
              </div>
              <div>
                <h1 className="font-bold text-xl md:text-2xl text-gray-900">
                  {overview?.name ?? "Staff"}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Employee ID: {employeeId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setShiftPage(0);
                setBillPage(0);
              }}
              className={inputClass}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setShiftPage(0);
                setBillPage(0);
              }}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            {
              label: "Total Orders",
              value: String(overview?.totalSales ?? 0),
              icon: <ShoppingCart size={16} className="text-blue-500" />,
              bg: "bg-blue-50",
            },
            {
              label: "Total Revenue",
              value: formatCurrencySymbol(
                overview?.totalRevenue ?? 0,
                currency.symbol,
                currency.locale,
              ),
              icon: <DollarSign size={16} className="text-green-500" />,
              bg: "bg-green-50",
            },
            {
              label: "Avg Time",
              value: overview?.avgTime ?? "—",
              icon: <Clock size={16} className="text-indigo-500" />,
              bg: "bg-indigo-50",
            },
            {
              label: "Total Pay In",
              value: formatCurrencySymbol(
                totalPayIn,
                currency.symbol,
                currency.locale,
              ),
              icon: <ArrowDownLeft size={16} className="text-emerald-500" />,
              bg: "bg-emerald-50",
            },
            {
              label: "Total Pay Out",
              value: formatCurrencySymbol(
                totalPayOut,
                currency.symbol,
                currency.locale,
              ),
              icon: <ArrowUpRight size={16} className="text-red-500" />,
              bg: "bg-red-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 truncate">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Staff Shifts ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock size={14} className="text-amber-500" />
              </div>
              Staff Shifts
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {shiftList.length} {shiftList.length === 1 ? "shift" : "shifts"}
            </span>
          </div>

          {shiftLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : shiftList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No shifts found for this date range
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-3 pt-3 px-3 font-medium w-10">
                        #
                      </th>
                      <th className="text-left pb-3 pt-3 px-3 font-medium">
                        Opening Time
                      </th>
                      <th className="text-left pb-3 pt-3 px-3 font-medium">
                        Closing Time
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Pay In
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Pay Out
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Total Sale
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Cash
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Online
                      </th>
                      <th className="text-center pb-3 pt-3 px-3 font-medium">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedShifts.map((shift, idx) => {
                      const isOpen = expandedShift === shift.shiftId;
                      return (
                        <tr
                          key={shift.shiftId ?? idx}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-3 px-3 text-gray-400 text-xs">
                            {shiftPage * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-800">
                            {shift.openingTime ?? "—"}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-800">
                            {shift.closingTIme ?? "—"}
                          </td>
                          <td className="py-3 px-3 text-right text-sm font-medium text-green-600">
                            {formatCurrencySymbol(
                              shift.payIn ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-sm font-medium text-red-600">
                            {formatCurrencySymbol(
                              shift.payOut ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-sm font-semibold text-gray-900">
                            {formatCurrencySymbol(
                              shift.totalSale ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-gray-700">
                            {formatCurrencySymbol(
                              shift.cashSale ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-gray-700">
                            {formatCurrencySymbol(
                              shift.onlineSale ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() =>
                                shift.shiftId && fetchShiftDetail(shift.shiftId)
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              {isOpen ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expanded shift detail */}
              {expandedShift && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2
                        size={16}
                        className="animate-spin text-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-500">
                        Loading shift details...
                      </span>
                    </div>
                  ) : shiftDetail ? (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            Opening Cash
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrencySymbol(
                              shiftDetail.openingCash,
                              currency.symbol,
                              currency.locale,
                            )}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            Closing Cash
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrencySymbol(
                              shiftDetail.closingCash,
                              currency.symbol,
                              currency.locale,
                            )}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            Opened At
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {shiftDetail.openingTime
                              ? (parseNepalDateTime(
                                  shiftDetail.openingTime,
                                )?.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) ?? "—")
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            Closed At
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {shiftDetail.closingTime
                              ? (parseNepalDateTime(
                                  shiftDetail.closingTime,
                                )?.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) ?? "—")
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Shift transactions */}
                      {shiftDetail.transactions?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            Shift Transactions
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[10px] text-gray-400 border-b border-gray-200">
                                  <th className="text-left pb-2 px-2 font-medium">
                                    Time
                                  </th>
                                  <th className="text-left pb-2 px-2 font-medium">
                                    Type
                                  </th>
                                  <th className="text-left pb-2 px-2 font-medium">
                                    Note
                                  </th>
                                  <th className="text-left pb-2 px-2 font-medium">
                                    Payment
                                  </th>
                                  <th className="text-right pb-2 px-2 font-medium">
                                    Amount
                                  </th>
                                  <th className="text-center pb-2 px-2 font-medium">
                                    Invoice
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {shiftDetail.transactions.map((txn) => {
                                  const txDate = parseNepalDateTime(
                                    txn.transactionTime,
                                  );
                                  const isPayIn =
                                    txn.transactionType === "pay-in";
                                  const isPayOut =
                                    txn.transactionType === "pay-out";
                                  return (
                                    <tr
                                      key={txn._id}
                                      className="border-b border-gray-50 last:border-0"
                                    >
                                      <td className="py-2 px-2 text-xs text-gray-600">
                                        {txDate
                                          ? txDate.toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "—"}
                                      </td>
                                      <td className="py-2 px-2">
                                        <span
                                          className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                                            isPayIn
                                              ? "bg-green-100 text-green-700"
                                              : isPayOut
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {isPayIn ? (
                                            <ArrowDownLeft size={10} />
                                          ) : isPayOut ? (
                                            <ArrowUpRight size={10} />
                                          ) : (
                                            <Receipt size={10} />
                                          )}
                                          {txn.transactionType}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-xs text-gray-600">
                                        {txn.note || "—"}
                                      </td>
                                      <td className="py-2 px-2 text-xs text-gray-600 capitalize">
                                        {txn.paymentMethod ?? "—"}
                                      </td>
                                      <td
                                        className={`py-2 px-2 text-right text-xs font-semibold ${
                                          isPayIn
                                            ? "text-green-600"
                                            : isPayOut
                                              ? "text-red-600"
                                              : "text-gray-900"
                                        }`}
                                      >
                                        {formatCurrencySymbol(
                                          txn.transactionAmount,
                                          currency.symbol,
                                          currency.locale,
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-center text-xs text-gray-500">
                                        {txn.invoiceNo
                                          ? `ORD-${txn.invoiceNo}`
                                          : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No shift details available
                    </p>
                  )}
                </div>
              )}

              {/* Shift pagination */}
              {shiftPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShiftPage(Math.max(0, shiftPage - 1))}
                    disabled={shiftPage === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      shiftPage === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <span className="text-xs text-gray-400 font-medium">
                    Page {shiftPage + 1} of {shiftPages}
                  </span>
                  <button
                    onClick={() =>
                      setShiftPage(Math.min(shiftPages - 1, shiftPage + 1))
                    }
                    disabled={shiftPage >= shiftPages - 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      shiftPage >= shiftPages - 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Transactions / Bills ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Receipt size={14} className="text-purple-500" />
              </div>
              Transactions / Bills
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </span>
          </div>

          {billLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No transactions found for this date range
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-3 pt-3 px-3 font-medium w-10">
                        #
                      </th>
                      <th className="text-left pb-3 pt-3 px-3 font-medium">
                        Order ID
                      </th>
                      <th className="text-left pb-3 pt-3 px-3 font-medium">
                        Date / Time
                      </th>
                      <th className="text-right pb-3 pt-3 px-3 font-medium">
                        Total
                      </th>
                      <th className="text-center pb-3 pt-3 px-3 font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBills.map((bill, idx) => {
                      const billDate = parseNepalDateTime(bill.paidAt);
                      return (
                        <tr
                          key={bill._id}
                          onClick={() =>
                            router.push(`/invoices/${bill.invoiceNo}`)
                          }
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 text-gray-400 text-xs">
                            {billPage * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-900 text-xs">
                            ORD-{bill.invoiceNo}
                          </td>
                          <td className="py-3 px-3">
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
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">
                            {formatCurrencySymbol(
                              bill.grandTotal ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/invoices/${bill.invoiceNo}`);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Receipt size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bill pagination */}
              {billPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setBillPage(Math.max(0, billPage - 1))}
                    disabled={billPage === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      billPage === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <span className="text-xs text-gray-400 font-medium">
                    Page {billPage + 1} of {billPages}
                  </span>
                  <button
                    onClick={() =>
                      setBillPage(Math.min(billPages - 1, billPage + 1))
                    }
                    disabled={billPage >= billPages - 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      billPage >= billPages - 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
