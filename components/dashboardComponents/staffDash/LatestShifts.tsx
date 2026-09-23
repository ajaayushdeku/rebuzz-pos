"use client";

import { useState, useCallback } from "react";
import { Clock, Loader2 } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  parseNepalDateTime,
  // extractTime,
} from "../staffDash/staffDetail/staffDetailHelpers";
import type { ShiftDetail } from "../staffDash/staffDetail/staffDetailHelpers";
import ShiftDetailModal from "../staffDash/staffDetail/ShiftDetailModal";
import { CHART_PALETTE, ChartCard, ChartPager } from "../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";
import SegmentedControl from "@/components/ui/SegmentedControl";
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

/**
 * The windows this card can narrow to. "all" is the page's own date range —
 * every other value is a day count read straight off the segment.
 */
const SHIFT_WINDOWS = [
  { value: "all", label: "All" },
  { value: "3", label: "3 days" },
  { value: "5", label: "5 days" },
  { value: "7", label: "7 days" },
] as const;

type ShiftWindow = (typeof SHIFT_WINDOWS)[number]["value"];

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
  const pageSize = 4;

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

  const [activePreset, setActivePreset] = useState<ShiftWindow>("all");

  const applyPreset = (days: number) => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    const startDt = start.toISOString().split("T")[0];
    setLocalStartDate(startDt);
    setLocalEndDate(end);
    setPage(0);
  };

  const resetFilter = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setPage(0);
  };

  // "All" is the page range itself, so the old dangling Reset button is now
  // just the first segment. It was the only way back and sat outside the
  // control it undid, appearing and disappearing as presets were clicked.
  const selectWindow = (next: ShiftWindow) => {
    setActivePreset(next);
    if (next === "all") resetFilter();
    else applyPreset(Number(next));
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
      ? "border border-amber-200 bg-amber-50 text-amber-700"
      : "border border-green-200 bg-green-50 text-green-700";
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
    <ChartCard
      icon={Clock}
      title="Latest Shifts"
      rangeBadge={true}
      info={{
        heading: "Reading this table",
        // The window segments narrow what the page range already fetched.
        body: "Shifts opened in the date range at the top of the page, newest first. The Show buttons narrow that further to the last few days — they never reach past the page's range. Total sales is what was rung up during the shift; click a row for its full detail.",
      }}
      subtitle="Latest Shifts from all the employees"
      controls={
        <div className="relative flex flex-row  items-center w-full justify-between md:justify-end gap-2 mb-6">
          <SegmentedControl
            label="Show:"
            accent="blue"
            options={SHIFT_WINDOWS}
            value={activePreset}
            onChange={selectWindow}
          />

          {!loading && totalPages > 1 && (
            <ChartPager
              first={safePage * pageSize + 1}
              last={Math.min((safePage + 1) * pageSize, filteredShifts.length)}
              total={filteredShifts.length}
              onPrev={() => setPage(Math.max(0, safePage - 1))}
              onNext={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              itemLabel="shifts"
            />
          )}

          <div className="absolute right-0 bottom-[-30px] hidden md:block">
            <RangeBadge variant="pill" />
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            size={20}
            className="animate-spin"
            style={{ color: CHART_PALETTE.subtitle }}
          />
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Clock size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No shifts found
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Shift data will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr
                  className="border-b text-[11px]"
                  style={{
                    borderColor: CHART_PALETTE.grid,
                    color: CHART_PALETTE.axis,
                  }}
                >
                  <th className="pb-2.5 pl-0 pt-1 text-left font-normal">
                    S.No.
                  </th>
                  <th className="pb-2.5 pl-0 pt-1 text-left font-normal">
                    Employee
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Opened at
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-left font-normal">
                    Closed at
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-right font-normal">
                    Total sales
                  </th>
                  <th className="px-3 pb-2.5 pt-1 text-center font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedShifts.map((shift, idx) => (
                  <tr
                    key={shift.shiftId}
                    className="cursor-pointer border-b transition-colors last:border-0"
                    style={{
                      borderColor: CHART_PALETTE.grid,
                      backgroundColor:
                        hoveredRow === shift.shiftId
                          ? CHART_PALETTE.hover
                          : "transparent",
                    }}
                    onMouseEnter={() => setHoveredRow(shift.shiftId)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() =>
                      shift.shiftId && fetchShiftDetail(shift.shiftId)
                    }
                  >
                    <td className="py-3 pl-0">
                      <span
                        className="text-[13px] tabular-nums"
                        style={{ color: CHART_PALETTE.subtitle }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 pl-0">
                      <span
                        className="text-[13px]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {shift.employeeName || "Unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-[11px]"
                          style={{ color: CHART_PALETTE.subtitle }}
                        >
                          {formatFullDate(shift.openingTime)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {formatDate(shift.openingTime)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-[11px]"
                          style={{ color: CHART_PALETTE.subtitle }}
                        >
                          {formatFullDate(shift.closingTime)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {formatDate(shift.closingTime)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className="text-[13px] font-medium tabular-nums"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        {formatCurrencySymbol(
                          shift.totalSale ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${getStatusColor(shift.closingTime)}`}
                      >
                        {getStatus(shift.closingTime)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ShiftDetailModal
        open={modalOpen}
        shiftDetail={modalDetail}
        loading={modalLoading}
        onClose={handleModalClose}
      />
    </ChartCard>
  );
}
