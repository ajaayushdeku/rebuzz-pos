import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
import {
  mockShiftAnalysisData,
  mockStaffData,
  mockStaffHourlyOrderData,
  mockStaffRevenue,
} from "@/lib/mockData/mock-staffdata";

export async function getStaffRevenue(): Promise<StaffRevenue[]> {
  return mockStaffRevenue;
}

export async function getStaffOrdersPerHour(): Promise<StaffHourlyData[]> {
  return mockStaffHourlyOrderData;
}

export async function getShiftAnalysisData(): Promise<Shift[]> {
  return mockShiftAnalysisData;
}

export async function getStaffData(): Promise<StaffBoxProps[]> {
  return mockStaffData;
}
// async function getShifts(): Promise<Shift[]> {
//   const res = await fetch("https://api", {
//     next: { revalidate: 3600 }
//   });
//   if (!res.ok) throw new Error("Failed to fetch shifts");
//   return res.json();
// }
