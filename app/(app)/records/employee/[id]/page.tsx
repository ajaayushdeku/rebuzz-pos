"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import type {
  StaffOverview,
  ShiftSummary,
  ShiftDetail,
  BillItem,
  EmployeeData,
} from "@/components/dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import { getDefaultDateRange } from "@/components/dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import StaffDetailHeader from "@/components/dashboardComponents/staffDash/staffDetail/StaffDetailHeader";
import StatsCardGrid from "@/components/dashboardComponents/staffDash/staffDetail/StatsCardGrid";
import ShiftsSection from "@/components/dashboardComponents/staffDash/staffDetail/ShiftsSection";
import WeeklySalesChart from "@/components/dashboardComponents/staffDash/staffDetail/WeeklySalesChart";
import BillsSection from "@/components/dashboardComponents/staffDash/staffDetail/BillsSection";
import PerformanceRadar from "@/components/dashboardComponents/staffDash/staffDetail/PerformanceRadar";
import TopItemsSales from "@/components/dashboardComponents/staffDash/staffDetail/TopItemsSales";

export default function StaffDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const avgTimeFromUrl = searchParams.get("avgTime");

  const defaults = getDefaultDateRange();
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetail, setModalDetail] = useState<ShiftDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [shiftPage, setShiftPage] = useState(0);
  const [billPage, setBillPage] = useState(0);
  const pageSize = 5;

  // ── Fetch staff overview + bills ────────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    const fetchData = async () => {
      setLoading(true);
      setBillLoading(true);
      try {
        const res = await fetch(
          `/api/staff/sales-by-employee/${employeeId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        const emp: EmployeeData = json?.data?.employeeData;
        if (emp) {
          setOverview({
            name: emp.name,
            totalSales: emp.totalSales ?? 0,
            totalRevenue: emp.totalRevenue ?? 0,
            avgTime: avgTimeFromUrl || "—",
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
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // ── Fetch shifts ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    const fetchShifts = async () => {
      setShiftLoading(true);
      try {
        const res = await fetch(
          `/api/staff/${employeeId}/shifts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
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
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // ── Fetch shift detail for modal ────────────────────────────────────────

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
      toast.error("Failed to load shift details");
    } finally {
      setModalLoading(false);
    }
  }, []);

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
  const billPages = Math.max(1, Math.ceil(bills.length / pageSize));

  const handleDateRangeChange = useCallback((range: DateRangeValue) => {
    setDateRange(range);
    setShiftPage(0);
    setBillPage(0);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalDetail(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-gray-500">
            Loading employee details...
          </span>
        </div>
      </div>
    );
  }

  return (
    // <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div>
        <StaffDetailHeader
          employeeId={employeeId}
          name={overview?.name ?? ""}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <StatsCardGrid
          overview={overview}
          totalPayIn={totalPayIn}
          totalPayOut={totalPayOut}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <div className="lg:col-span-1">
            <WeeklySalesChart
              bills={bills}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </div>
          <div className="lg:col-span-1">
            <PerformanceRadar
              employeeId={employeeId}
              avgTime={avgTimeFromUrl}
              dateRange={dateRange}
            />
          </div>
        </div>

        <TopItemsSales employeeId={employeeId} dateRange={dateRange} />

        <ShiftsSection
          shifts={shifts}
          shiftLoading={shiftLoading}
          shiftPage={shiftPage}
          pageSize={pageSize}
          shiftPages={shiftPages}
          onPageChange={setShiftPage}
          onFetchShiftDetail={fetchShiftDetail}
          modalOpen={modalOpen}
          modalDetail={modalDetail}
          modalLoading={modalLoading}
          onModalClose={handleModalClose}
        />

        <BillsSection employeeId={employeeId} dateRange={dateRange} />
      </div>
    </div>
  );
}
