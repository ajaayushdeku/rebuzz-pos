"use client";

import { useState, useCallback } from "react";
import { Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  parseNepalDateTime,
  extractTime,
} from "../staffDash/staffDetail/staffDetailHelpers";
import type { ShiftDetail } from "../staffDash/staffDetail/staffDetailHelpers";
import ShiftDetailModal from "../staffDash/staffDetail/ShiftDetailModal";
// import { DateRangeFilter, type DateRangeValue } from "./DateRangeFilter";

interface LatestShiftsProps {
  shifts: RawShift[];
  loading: boolean;
  startDate?: string;
  endDate?: string;
}

interface RawShift {
  shiftId: string;
  employeeId: string;
  employeeName: string;
  openingTime: string;
  closingTime: string;
  totalHours: string;
  totalSale: number;
  openingCash: number;
  closingCash: number;
}

export default function LatestShifts({
  shifts,
  loading,
  startDate,
  endDate,
}: LatestShiftsProps) {
  const { currency } = useCurrency();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetail, setModalDetail] = useState<ShiftDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [page, setPage] = useState(0);
  const pageSize = 3;

  // Local state for preset filtering
  const [localStartDate, setLocalStartDate] = useState<string | undefined>(
    startDate,
  );
  const [localEndDate, setLocalEndDate] = useState<string | undefined>(endDate);

  // Use local dates if set, otherwise fall back to props
  const effectiveStartDate = localStartDate || startDate;
  const effectiveEndDate = localEndDate || endDate;

  const filteredShifts = shifts.filter((shift) => {
    if (!effectiveStartDate || !effectiveEndDate) return true;
    const shiftDate =
      shift.openingTime?.split("T")[0] ?? shift.openingTime?.split(" ")[0];
    if (!shiftDate) return true;
    return shiftDate >= effectiveStartDate && shiftDate <= effectiveEndDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedShifts = filteredShifts.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  );

  const [activePreset, setActivePreset] = useState<string>("");

  const applyPreset = (days: number) => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    const startDt = start.toISOString().split("T")[0];
    setLocalStartDate(startDt);
    setLocalEndDate(end);
    setActivePreset(`${days}days`);
    setPage(0);
  };

  const resetFilter = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setActivePreset("");
    setPage(0);
  };

  function formatFullDate(raw: string | undefined): string {
    if (!raw) return "—";
    const d = parseNepalDateTime(raw);
    if (d) {
      return d.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const datePart = raw.split("T")[0] ?? raw.split(" ")[0] ?? raw;
    const dateOnly = datePart.split(" ")[0];
    return dateOnly;
  }

  function formatDate(raw: string | undefined): string {
    if (!raw) return "—";

    const d = parseNepalDateTime(raw);
    if (d) {
      return d.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (match) {
      const hour = match[1];
      const minute = match[2];
      const ampm = match[3].toUpperCase();
      return `${hour}:${minute} ${ampm}`;
    }

    const fallback = raw.match(/(\d{1,2}):(\d{2})/);
    if (fallback) {
      const h = parseInt(fallback[1], 10);
      const m = fallback[2];
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    }

    return raw;
  }

  const getStatus = (closingTime: string | undefined) => {
    return !!closingTime ? "Closed" : "Open";
  };

  const getStatusColor = (closingTime: string | undefined) => {
    const isClosed = !!closingTime;
    return isClosed
      ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
      : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200";
  };

  const fetchShiftDetail = useCallback(async (shiftId: string) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/staff/shift/${shiftId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const details: ShiftDetail[] = json?.data?.shiftDetails ?? [];
      setModalDetail(details[0] ?? null);
    } catch {
      setModalDetail(null);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalDetail(null);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition duration-300 p-4 md:p-6 w-full mt-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="mb-0">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Latest Shifts
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {/* {filteredShifts.length}{" "}
            {filteredShifts.length === 1 ? "shift" : "shifts"} recorded */}
            Latest Shifts from all the employees
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className=" px-3 pr-0 text-xs font-medium text-gray-500">
            {" "}
            For last:
          </p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 inline-flex">
            <button
              onClick={() => applyPreset(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === "3days"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              3 Days
            </button>
            <button
              onClick={() => applyPreset(5)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === "5days"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              5 Days
            </button>
            <button
              onClick={() => applyPreset(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === "7days"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              7 Days
            </button>
          </div>
          {activePreset && (
            <button
              onClick={resetFilter}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-amber-500" />
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No shifts found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left pb-3 pl-0 font-semibold">S.No.</th>
                  <th className="text-left pb-3 pl-0 font-semibold">
                    Employee
                  </th>
                  <th className="text-left pb-3 px-3 font-semibold">
                    Opened At
                  </th>
                  <th className="text-left pb-3 px-3 font-semibold">
                    Closed At
                  </th>
                  <th className="text-right pb-3 px-3 font-semibold">
                    Total Sales
                  </th>
                  <th className="text-center pb-3 px-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedShifts.map((shift, idx) => (
                  <tr
                    key={shift.shiftId}
                    className="border-b border-gray-50/80 last:border-0 transition-colors cursor-pointer"
                    style={{
                      backgroundColor:
                        hoveredRow === shift.shiftId
                          ? "#f9fafb"
                          : "transparent",
                    }}
                    onMouseEnter={() => setHoveredRow(shift.shiftId)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() =>
                      shift.shiftId && fetchShiftDetail(shift.shiftId)
                    }
                  >
                    <td className="py-3 pl-0">
                      <span className="text-[13px] font-semibold text-gray-400">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 pl-0">
                      <span className="text-[13px] font-semibold text-gray-900">
                        {shift.employeeName || "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          {formatFullDate(shift.openingTime)}
                        </span>
                        <span className="text-[12px] font-medium text-gray-700">
                          {formatDate(shift.openingTime)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          {formatFullDate(shift.closingTime)}
                        </span>
                        <span className="text-[12px] font-medium text-gray-700">
                          {formatDate(shift.closingTime)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[13px] font-bold text-gray-900">
                        {formatCurrencySymbol(
                          shift.totalSale ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${getStatusColor(shift.closingTime)}`}
                      >
                        {getStatus(shift.closingTime)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  safePage === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs text-gray-400 font-medium">
                Page {safePage + 1} of {totalPages} · {filteredShifts.length}{" "}
                shifts
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  safePage >= totalPages - 1
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

      <ShiftDetailModal
        open={modalOpen}
        shiftDetail={modalDetail}
        loading={modalLoading}
        onClose={handleModalClose}
      />
    </div>
  );
}
