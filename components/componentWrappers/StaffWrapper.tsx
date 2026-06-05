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

const RANGE_OPTIONS: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export async function StaffStatWrapper({
  range = "month",
}: {
  range?: string;
}) {
  const staffList = await getStaffData(range);

  if (staffList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No staff data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      {staffList.map((staff) => (
        <StaffStatBox key={staff.staffName} {...staff} />
      ))}
    </div>
  );
}

export async function StaffOrdersChartWrapper({
  range = "month",
}: {
  range?: string;
}) {
  const data = await getStaffOrdersPerHour(range);
  return <StaffOrdersChart data={data} />;
}

export async function StaffRevenueWrapper({
  range = "month",
}: {
  range?: string;
}) {
  const data = await getStaffRevenue(range);
  return <RevenueStaffChart data={data} />;
}

export async function ShiftAnalysisWrapper({
  range = "month",
}: {
  range?: string;
}) {
  const shifts = await getShiftAnalysisData(range);
  return <ShiftAnalysisReport shifts={shifts} />;
}
