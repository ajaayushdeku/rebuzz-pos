import StaffStatBox from "@/components/dashboardComponents/staffDash/StaffStatBox";
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
    <div className="my-4 -mx-2 sm:mx-0">
      {/* Mobile: horizontal scroll with fixed-width cards, Desktop: grid */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-x-auto pb-2 px-2 sm:px-0 sm:overflow-visible snap-x snap-mandatory scrollbar-thin">
        {displayStaff.map((staff, idx) => (
          <div
            key={staff.staffName}
            className="snap-start shrink-0 w-[85vw] sm:w-auto sm:shrink"
          >
            <StaffStatBox {...staff} colorIndex={idx} />
          </div>
        ))}
      </div>
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
