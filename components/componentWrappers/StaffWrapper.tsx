import StaffBoxContainer from "@/components/dashboardComponents/staffDash/StaffBoxContainer";
import StaffSalesChart from "@/components/dashboardComponents/staffDash/StaffSalesChart";
import RevenueStaffChart from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import ShiftAnalysisReport from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import LatestShifts from "@/components/dashboardComponents/staffDash/LatestShifts";

import {
  getStaffData,
  getStaffRevenue,
  getStaffSalesPerHour,
  getShiftAnalysisData,
  fetchAllShifts,
} from "@/services/dashboardServices/apiStaff";

// const RANGE_OPTIONS: { label: string; value: string }[] = [
//   { label: "Today", value: "today" },
//   { label: "Week", value: "week" },
//   { label: "Month", value: "month" },
//   { label: "Year", value: "year" },
// ];

export async function StaffStatWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const staffList = await getStaffData(range, startDate, endDate);

  return <StaffBoxContainer staffList={staffList} />;
}

// export async function StaffOrdersChartWrapper({
//   range = "month",
// }: {
//   range?: string;
// }) {
//   const data = await getStaffOrdersPerHour(range);
//   return <StaffOrdersChart data={data} />;
// }

export async function StaffSalesChartWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const data = await getStaffSalesPerHour(range, startDate, endDate);
  const limitedData = data.map((hourSlot) => ({
    ...hourSlot,
    staff: hourSlot.staff.slice(0, 8),
  }));
  return <StaffSalesChart data={limitedData} />;
}

export async function StaffRevenueWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const data = await getStaffRevenue(range, startDate, endDate);
  return <RevenueStaffChart data={data} />;
}

export async function ShiftAnalysisWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const shifts = await getShiftAnalysisData(range, startDate, endDate);
  return <ShiftAnalysisReport shifts={shifts} />;
}

export async function LatestShiftsWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const shifts = await fetchAllShifts(range, startDate, endDate);
  return (
    <LatestShifts
      shifts={shifts}
      loading={false}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
