// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
// } from "@/components/ui/carousel";
// import StaffStatBox from "../dashboardComponents/staffDash/StaffStatBox";
// import RevenueStaffChart from "../dashboardComponents/staffDash/RevenueStaffChart";
// import StaffOrdersChart from "../dashboardComponents/staffDash/StaffOrdersChart";
// import ShiftAnalysisReport from "../dashboardComponents/staffDash/ShiftAnalysisReport";
// import {
//   getShiftAnalysisData,
//   getStaffData,
//   getStaffOrdersPerHour,
//   getStaffRevenue,
// } from "@/services/dashboardServices/apiStaff";

// export async function StaffStatWrapper() {
//   const staffData = await getStaffData();

//   console.log("Fetched staff data:", staffData); // Debug log to check fetched data
//   return (
//     <Carousel
//       opts={{
//         align: "start",
//         dragFree: true,
//       }}
//       className="w-full my-4"
//     >
//       <CarouselContent className="-ml-3">
//         {staffData.map((staff) => (
//           <CarouselItem
//             key={staff.staffName}
//             className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
//           >
//             <StaffStatBox {...staff} />
//           </CarouselItem>
//         ))}
//       </CarouselContent>
//     </Carousel>
//   );
// }
// export async function StaffRevenueWrapper() {
//   const staffRevenueData = await getStaffRevenue();
//   return <RevenueStaffChart data={staffRevenueData} />;
// }
// export async function StaffOrdersChartWrapper() {
//   const staffOrderData = await getStaffOrdersPerHour();
//   return <StaffOrdersChart data={staffOrderData} />;
// }

// export async function ShiftAnalysisWrapper() {
//   const shiftAnalysisData = await getShiftAnalysisData();
//   return <ShiftAnalysisReport shifts={shiftAnalysisData} />;
// }

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

export async function StaffStatWrapper() {
  const staffList = await getStaffData();

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

export async function StaffOrdersChartWrapper() {
  const data = await getStaffOrdersPerHour();
  return <StaffOrdersChart data={data} />;
}

export async function StaffRevenueWrapper() {
  const data = await getStaffRevenue();
  return <RevenueStaffChart data={data} />;
}

export async function ShiftAnalysisWrapper() {
  const shifts = await getShiftAnalysisData();
  return <ShiftAnalysisReport shifts={shifts} />;
}
