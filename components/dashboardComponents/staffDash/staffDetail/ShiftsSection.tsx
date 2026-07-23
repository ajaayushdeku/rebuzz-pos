"use client";

import {
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Circle,
  Eye,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime, extractTime } from "./staffDetailHelpers";
import type { ShiftSummary, ShiftDetail } from "./staffDetailHelpers";
import ShiftDetailModal from "./ShiftDetailModal";
import { ComponentHeader } from "@/components/ComponentHeader";

interface ShiftsSectionProps {
  shifts: ShiftSummary[];
  shiftLoading: boolean;
  shiftError?: string | null;
  onRetry?: () => void;
  shiftPage: number;
  pageSize: number;
  shiftPages: number;
  onPageChange: (page: number) => void;
  onFetchShiftDetail: (shiftId: string) => void;
  modalOpen: boolean;
  modalDetail: ShiftDetail | null;
  modalLoading: boolean;
  modalError?: string | null;
  onModalClose: () => void;
}

/* ── Robust date parser with fallback ── */

function tryParse(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = parseNepalDateTime(raw);
  if (d) return d;
  const datePart = raw.split("T")[0] ?? raw.split(" ")[0] ?? raw;
  const fallback = new Date(datePart);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShiftDateRange(
  openingTime: string | undefined,
  closingTime: string | undefined,
): string {
  const openD = tryParse(openingTime);
  const closeD = tryParse(closingTime);
  if (!openD) return "—";
  if (!closeD) return formatDateFull(openD);

  const sameDay =
    openD.getDate() === closeD.getDate() &&
    openD.getMonth() === closeD.getMonth() &&
    openD.getFullYear() === closeD.getFullYear();

  if (sameDay) return formatDateFull(openD);
  return `${formatDateShort(openD)} - ${formatDateShort(closeD)}, ${closeD.getFullYear()}`;
}

/* ── Time with AM/PM ── */
const extractTimeWithAmPm = (raw: string | undefined): string => {
  if (!raw) return "—";

  const d = parseNepalDateTime(raw);
  if (d) {
    return d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ── Fallback: raw string already has explicit AM/PM, e.g. "2026-05-21 04:34:09 PM" ──
  const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
  if (match) {
    const hour = match[1];
    const minute = match[2];
    const ampm = match[3].toUpperCase();
    return `${hour}:${minute} ${ampm}`;
  }

  // Fallback for 24-hour format without AM/PM marker
  const fallback = raw.match(/(\d{1,2}):(\d{2})/);
  if (fallback) {
    const h = parseInt(fallback[1], 10);
    const m = fallback[2];
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  return raw;
};

/* ── Status badge ── */

function StatusBadge({ closingTime }: { closingTime?: string }) {
  const isClosed = !!closingTime;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
        isClosed
          ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
          : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
      }`}
    >
      <Circle
        size={5}
        className={isClosed ? "fill-amber-500" : "fill-green-400"}
      />
      {isClosed ? "Closed" : "Open"}
    </span>
  );
}

export default function ShiftsSection({
  shifts,
  shiftLoading,
  shiftError,
  onRetry,
  shiftPage,
  pageSize,
  shiftPages,
  onPageChange,
  onFetchShiftDetail,
  modalOpen,
  modalDetail,
  modalLoading,
  modalError,
  onModalClose,
}: ShiftsSectionProps) {
  const { currency } = useCurrency();

  const shiftList = shifts.filter((s) => s.shiftId);
  const pagedShifts = shiftList.slice(
    shiftPage * pageSize,
    (shiftPage + 1) * pageSize,
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock size={15} className="text-orange-500" />
            </div>

            <ComponentHeader
              title="Staff Shifts"
              subHeader={`${shiftList.length} ${shiftList.length === 1 ? "shift" : "shifts"}
                recorded`}
            />
          </div>
        </div>

        {shiftLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-amber-500" />
          </div>
        ) : shiftError ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">{shiftError}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : shiftList.length !== 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-500">No shifts found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your date range
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="text-left pb-3 pr-3 pl-0 font-semibold w-8">
                      S.No.
                    </th>
                    <th className="text-left pb-3 px-3 font-semibold">Shift</th>
                    <th className="text-right pb-3 px-3 font-semibold">
                      Opening Cash
                    </th>
                    <th className="text-right pb-3 px-3 font-semibold">
                      Cash Movement
                    </th>
                    <th className="text-right pb-3 px-3 font-semibold">
                      Closing Cash
                    </th>
                    <th className="text-right pb-3 px-3 font-semibold">
                      Total Sales
                    </th>
                    <th className="text-center pb-3 px-3 font-semibold">
                      Status
                    </th>
                    <th className="text-center pb-3 pl-3 pr-0 font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedShifts.map((shift, idx) => (
                    <tr
                      key={shift.shiftId ?? idx}
                      className="border-b border-gray-50/80 last:border-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="py-3.5 pr-3 pl-0 text-[11px] text-gray-300 font-mono align-top">
                        #{String(shiftPage * pageSize + idx + 1)}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <div className="leading-snug">
                          <p className="text-[11px] text-gray-500 mb-1.5 font-medium">
                            {formatShiftDateRange(
                              shift.openingTime,
                              shift.closingTIme,
                            )}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                Open
                              </span>
                              <span className="text-[10px] font-semibold text-gray-900">
                                {extractTimeWithAmPm(shift.openingTime)}
                              </span>
                            </div>
                            <span className="text-gray-300 text-[10px]">|</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                Close
                              </span>
                              <span className="text-[10px] font-semibold text-gray-900">
                                {extractTimeWithAmPm(shift.closingTIme)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right align-top">
                        <span className="text-[13px] font-semibold text-gray-800">
                          {formatCurrencySymbol(
                            shift.openingCash ?? 0,
                            currency.symbol,
                            currency.locale,
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right align-top">
                        <div className="leading-tight space-y-1">
                          <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-emerald-600">
                            <ArrowDownLeft size={10} className="shrink-0" />
                            {formatCurrencySymbol(
                              shift.payIn ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </p>
                          <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-red-500">
                            <ArrowUpRight size={10} className="shrink-0" />
                            {formatCurrencySymbol(
                              shift.payOut ?? 0,
                              currency.symbol,
                              currency.locale,
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right align-top">
                        <span className="text-[13px] font-semibold text-gray-800">
                          {formatCurrencySymbol(
                            shift.closingCash ?? 0,
                            currency.symbol,
                            currency.locale,
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right align-top">
                        <p className="text-[13px] font-bold text-gray-900">
                          {formatCurrencySymbol(
                            shift.totalSale ?? 0,
                            currency.symbol,
                            currency.locale,
                          )}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-center align-top">
                        <div className="inline-flex">
                          <StatusBadge closingTime={shift.closingTIme} />
                        </div>
                      </td>
                      <td className="py-3.5 pl-3 pr-0 text-center align-top">
                        <button
                          onClick={() =>
                            shift.shiftId && onFetchShiftDetail(shift.shiftId)
                          }
                          className="p-1.5 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                          title="View shift details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {shiftPages > 1 && (
              <Pagination
                page={shiftPage}
                totalPages={shiftPages}
                total={shiftList.length}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </div>

      <ShiftDetailModal
        open={modalOpen}
        shiftDetail={modalDetail}
        loading={modalLoading}
        error={modalError}
        onClose={onModalClose}
      />
    </>
  );
}

const Pagination = ({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) => {
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          page === 0
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <ChevronLeft size={14} />
        Previous
      </button>
      <span className="text-xs text-gray-400 font-medium">
        Page {page + 1} of {totalPages} · {total} shifts
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          page >= totalPages - 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
