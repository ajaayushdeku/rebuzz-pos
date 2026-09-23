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
  Timer,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  parseNepalDateTime,
  // extractTime,
  formatShiftDuration,
} from "./staffDetailHelpers";
import type { ShiftSummary, ShiftDetail } from "./staffDetailHelpers";
import ShiftDetailModal from "./ShiftDetailModal";
import { CardInfo, CHART_PALETTE } from "../../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";

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

  const d = new Date(raw);

  if (!isNaN(d.getTime())) {
    return d;
  }

  return parseNepalDateTime(raw);
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

/* ── Shift duration ── */

/**
 * Prefers the shared duration helper, which works off the timestamps this row
 * already shows. `totalHours` is only supplied by the staff-shifts path — the
 * analytics path builds its ShiftSummary without it — so it is a fallback,
 * not the source. An open shift has no end yet and reads "—"; the Status
 * badge on the same row explains why.
 */
function shiftDuration(shift: ShiftSummary): string {
  const computed = formatShiftDuration(shift.openingTime, shift.closingTIme);
  if (computed) return computed;

  if (shift.totalHours) {
    const [h, m] = shift.totalHours.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }

  return "—";
}

/* ── Time with AM/PM ── */
const extractTimeWithAmPm = (raw: string | undefined): string => {
  if (!raw) return "—";

  const d = new Date(raw);

  if (!isNaN(d.getTime())) {
    return d.toLocaleString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
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
      <div className="w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex min-w-0 flex-row items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fed7aa", backgroundColor: "#fff7ed" }}
            >
              <Clock size={16} style={{ color: "#ea580c" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="flex items-center gap-1.5 text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Staff Shifts
                <CardInfo
                  heading="Reading this table"
                  label="Staff Shifts"
                  // Cash movement and the expected-vs-counted difference.
                  body="Shifts this employee opened in the date range at the top of the page. Cash movement is pay-ins less pay-outs during the shift; closing cash is what was counted at the end. A shift with no closing time is still open, so its duration reads “—”. Click a row for the full breakdown."
                />
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                {shifts.length} {shifts.length === 1 ? "shift" : "shifts"}{" "}
                recorded
              </p>
            </div>
          </div>
          <RangeBadge variant="pill" />
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
                className="mt-3 cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
              >
                Retry
              </button>
            )}
          </div>
        ) : shiftList.length === 0 ? (
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
              <table className="w-full min-w-[1020px] text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400  tracking-wider border-b border-gray-100">
                    <th className="text-left pb-2.5 pt-1 pr-3 pl-0 font-normal w-8">
                      S.No.
                    </th>
                    <th className="text-left pb-2.5 pt-1 px-3 font-normal">
                      Shift
                    </th>
                    <th className="text-left pb-2.5 pt-1 px-3 font-normal">
                      Total Shift Time
                    </th>
                    <th className="text-right pb-2.5 pt-1 px-3 font-normal">
                      Opening Cash
                    </th>
                    <th className="text-right pb-2.5 pt-1 px-3 font-normal">
                      Cash Movement
                    </th>
                    <th className="text-right pb-2.5 pt-1 px-3 font-normal">
                      Closing Cash
                    </th>
                    <th className="text-right pb-2.5 pt-1 px-3 font-normal">
                      Total Sales
                    </th>
                    <th className="text-center pb-2.5 pt-1 px-3 font-normal">
                      Status
                    </th>
                    <th className="text-center pb-2.5 pt-1 pl-3 pr-0 font-normal w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedShifts.map((shift, idx) => (
                    <tr
                      key={shift.shiftId ?? idx}
                      className="border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#f8f9fa]"
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
                              <span className="text-[11px] text-[#9aa0a6]">
                                Open
                              </span>
                              <span className="text-[10px] font-semibold text-gray-900">
                                {extractTimeWithAmPm(shift.openingTime)}
                              </span>
                            </div>
                            <span className="text-gray-300 text-[10px]">|</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#9aa0a6]">
                                Close
                              </span>
                              <span className="text-[10px] font-semibold text-gray-900">
                                {extractTimeWithAmPm(shift.closingTIme)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-gray-800">
                          <Timer size={12} className="shrink-0 text-gray-400" />
                          {shiftDuration(shift)}
                        </span>
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
                        <p className="text-[13px] font-medium text-[#3c4043] tabular-nums">
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
                          className="cursor-pointer rounded-lg p-1.5 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#3c4043]"
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
