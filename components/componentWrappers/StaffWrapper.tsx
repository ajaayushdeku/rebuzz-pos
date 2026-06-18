import StaffStatBox from "@/components/dashboardComponents/staffDash/StaffStatBox";
import StaffOrdersChart from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
import RevenueStaffChart from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import ShiftAnalysisReport from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";

import {
  getStaffData,
  getStaffRevenue,
  getStaffOrdersPerHour,
  getShiftAnalysisData,
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

  if (staffList.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-gray-400 text-sm">
        <span className="font-medium">No staff data available</span>
        <p className="mt-1 text-xs text-gray-300">
          Try switching to a different date range to see staff members and their
          performance.
        </p>
      </div>
    );
  }

  const displayStaff = staffList.slice(0, 8);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      {displayStaff.map((staff, idx) => (
        <StaffStatBox key={staff.staffName} {...staff} colorIndex={idx} />
      ))}
    </div>
  );
}

// export async function StaffOrdersChartWrapper({
//   range = "month",
// }: {
//   range?: string;
// }) {
//   const data = await getStaffOrdersPerHour(range);
//   return <StaffOrdersChart data={data} />;
// }

export async function StaffOrdersChartWrapper({
  range = "month",
  startDate,
  endDate,
}: {
  range?: string;
  startDate?: string;
  endDate?: string;
}) {
  const data = await getStaffOrdersPerHour(range, startDate, endDate);
  const limitedData = data.map((hourSlot) => ({
    ...hourSlot,
    staff: hourSlot.staff.slice(0, 8),
  }));
  return <StaffOrdersChart data={limitedData} />;
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
