"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
import InvoiceListSection from "@/components/dashboardComponents/staffDash/staffDetail/InvoiceListSection";

export interface StaffUser {
  _id: string;
  adminId: string;
  countryCode: string;
  currency: string;
  email: string;
  emailVerified: boolean;
  favourites: string[];
  hasPrinter: string;
  isSubscribed: boolean;
  name: string;
  note: string | null;
  permissions: string[];
  phone: string;
  role: "staff" | "admin";
  subscriptionType: string;
}

export default function StaffDetailPage() {
  const params = useParams();
  const employeeId = params.id as string;

  const defaults = getDefaultDateRange();
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const [employeeDetail, setEmployeeDetail] = useState<StaffUser | null>();
  const [ownerDetail, setOwnerDetail] = useState<StaffUser | null>();
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [employeeRole, setEmployeeRole] = useState<string>("Basic");
  const [avgTime, setAvgTime] = useState<string>("—");

  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetail, setModalDetail] = useState<ShiftDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [shiftPage, setShiftPage] = useState(0);
  const pageSize = 5;

  // ── Fetch user details (name, role) ─────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/staff/${employeeId}`);
        if (res.ok) {
          const data = await res.json();
          const user = data?.data?.user ?? data?.user ?? data;
          if (user) {
            setEmployeeDetail(user);
            if (user.role) {
              setEmployeeRole(user.role);
            }
          }
        }
      } catch {
        // Silently fail - user details are optional
      }
    };
    fetchUser();
  }, [employeeId]);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const res = await fetch("/api/profile");

        if (res.ok) {
          const data = await res.json();

          const user = data?.data?.user;

          console.log("USER:", user);

          if (user) {
            setOwnerDetail(user);
            setEmployeeRole(user.role);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchOwner();
  }, []);

  console.log("USER:", ownerDetail?.name);

  // ── Fetch staff overview + bills ────────────────────────────────────────
  useEffect(() => {
    if (!employeeId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // ── All three fetches in parallel ─────────────────────────────────
        const [salesRes, ticketsRes, shiftsAllRes] = await Promise.all([
          fetch(
            `/api/staff/sales-by-employee/${employeeId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          ),
          fetch(
            `/api/staff/${employeeId}/tickets?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          ),
          fetch(
            `/api/staff/shifts-all?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          ),
        ]);

        if (!salesRes.ok) throw new Error("Failed to fetch sales data");
        const salesJson = await salesRes.json();
        const emp: EmployeeData = salesJson?.data?.employeeData;

        // ── Ticket count ──────────────────────────────────────────────────
        let ticketCount = 0;
        if (ticketsRes.ok) {
          const ticketsJson = await ticketsRes.json();
          ticketCount = ticketsJson?.data?.totalCount ?? 0;
        }

        // ── avgTime from shifts ───────────────────────────────────────────
        let computedAvgTime = "—";
        if (shiftsAllRes.ok) {
          const shiftsJson = await shiftsAllRes.json();
          const allShifts: { employeeId: string; totalHours: string }[] =
            Array.isArray(shiftsJson?.data) ? shiftsJson.data : [];

          const employeeShifts = allShifts.filter(
            (s) => s.employeeId === employeeId,
          );

          if (employeeShifts.length > 0) {
            const totalMinutes = employeeShifts.reduce((sum, shift) => {
              const parts = shift.totalHours.split(":").map(Number);
              if (parts.length !== 3) return sum;
              return sum + parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
            }, 0);

            const avgMin = Math.round(totalMinutes / employeeShifts.length);
            const hrs = Math.floor(avgMin / 60);
            const mins = avgMin % 60;
            computedAvgTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          }
        }

        setAvgTime(computedAvgTime);

        if (emp) {
          setOverview({
            name: emp.name,
            totalSales: emp.totalSales ?? 0,
            totalRevenue: emp.totalRevenue ?? 0,
            totalOrders: ticketCount,
            avgTime: computedAvgTime,
          });
          setBills(emp.bills ?? []);
        }
      } catch {
        toast.error("Failed to load staff data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // ── Fetch shifts ─────────────────────────────────────────────────
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
        const shiftsData = json?.data ?? [];
        setShifts(shiftsData);
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

  const handleDateRangeChange = useCallback((range: DateRangeValue) => {
    setDateRange(range);
    setShiftPage(0);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalDetail(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex items-center">
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
          name={
            employeeDetail?.name ?? ownerDetail?.name ?? overview?.name ?? ""
          }
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        <StatsCardGrid
          overview={overview}
          totalPayIn={totalPayIn}
          totalPayOut={totalPayOut}
          showOnlyOrders={employeeRole === "staff"}
        />

        {employeeRole !== "staff" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
              <div className="lg:col-span-1">
                <WeeklySalesChart employeeId={employeeId} />
              </div>
              <div className="lg:col-span-1">
                <PerformanceRadar
                  employeeId={employeeId}
                  avgTime={avgTime}
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
          </>
        )}

        <InvoiceListSection employeeId={employeeId} dateRange={dateRange} />
      </div>
    </div>
  );
}
