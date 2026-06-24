import { Shift } from "../../components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffRevenue } from "../../components/dashboardComponents/staffDash/RevenueStaffChart";
import { StaffBoxProps } from "../../components/dashboardComponents/staffDash/StaffStatBox";
import { StaffHourlyData } from "../../components/dashboardComponents/staffDash/StaffSalesChart";

export const mockStaffData: StaffBoxProps[] = [
  {
    staffId: "staff-1",
    staffName: "Arthur Morgan",
    staffPosition: "Senior Barista",
    salesTaken: 5,
    ordersTaken: 8,
    // avgTime: 4.5,
    // rating: 4.9,
    // shiftTime: "Morning",
    amount: 5000,
  },
  {
    staffId: "staff-2",
    staffName: "Dutch Vanderlinde",
    staffPosition: "Senior Barista",
    salesTaken: 3,
    ordersTaken: 5,
    // avgTime: 4.8,
    // rating: 4.2,
    // shiftTime: "Morning",
    amount: 2000,
  },
  {
    staffId: "staff-3",
    staffName: "John Marston",
    staffPosition: "Barista",
    salesTaken: 6,
    ordersTaken: 10,
    // avgTime: 4.3,
    // rating: 4.7,
    // shiftTime: "Afternoon",
    amount: 3000,
  },
  {
    staffId: "staff-4",
    staffName: "Charles",
    staffPosition: "Barista",
    salesTaken: 7,
    ordersTaken: 12,
    // avgTime: 4.3,
    // rating: 4.7,
    // shiftTime: "Evening",
    amount: 2000,
  },
  {
    staffId: "staff-5",
    staffName: "Micah",
    staffPosition: "Barista",
    salesTaken: 2,
    ordersTaken: 3,
    // avgTime: 5,
    // rating: 2.5,
    // shiftTime: "Evening",
    amount: 1000,
  },
];

export const mockStaffRevenue: StaffRevenue[] = [
  { name: "Arthur", revenue: 6900 },
  { name: "John", revenue: 5000 },
  { name: "Dutch", revenue: 4600 },
  { name: "Charles", revenue: 4000 },
  { name: "Micah", revenue: 4100 },
];

export const mockStaffHourlyOrderData: StaffHourlyData[] = [
  {
    hour: "7am",
    staff: [
      { name: "Arthur", value: 22 },
      { name: "John", value: 18 },
      { name: "Dutch", value: 0 },
      { name: "Charles", value: 15 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "8am",
    staff: [
      { name: "Arthur", value: 32 },
      { name: "John", value: 28 },
      { name: "Dutch", value: 0 },
      { name: "Charles", value: 25 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "9am",
    staff: [
      { name: "Arthur", value: 46 },
      { name: "John", value: 42 },
      { name: "Dutch", value: 0 },
      { name: "Charles", value: 38 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "10am",
    staff: [
      { name: "Arthur", value: 55 },
      { name: "John", value: 52 },
      { name: "Dutch", value: 0 },
      { name: "Charles", value: 46 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "11am",
    staff: [
      { name: "Arthur", value: 54 },
      { name: "John", value: 50 },
      { name: "Dutch", value: 0 },
      { name: "Charles", value: 44 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "12pm",
    staff: [
      { name: "Arthur", value: 35 },
      { name: "John", value: 32 },
      { name: "Dutch", value: 2 },
      { name: "Charles", value: 30 },
      { name: "Micah", value: null },
    ],
  },
  {
    hour: "1pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 24 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 30 },
    ],
  },
  {
    hour: "2pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 22 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 26 },
    ],
  },
  {
    hour: "3pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 19 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 24 },
    ],
  },
  {
    hour: "4pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 22 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 28 },
    ],
  },
  {
    hour: "5pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 28 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 36 },
    ],
  },
  {
    hour: "6pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 31 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 40 },
    ],
  },
  {
    hour: "7pm",
    staff: [
      { name: "Arthur", value: 0 },
      { name: "John", value: 0 },
      { name: "Dutch", value: 28 },
      { name: "Charles", value: 0 },
      { name: "Micah", value: 33 },
    ],
  },
];
export const mockShiftAnalysisData: Shift[] = [
  {
    label: "Morning (7–1pm)",
    orders: 680,
    // avgTime: 420,
    revenue: 1600,
    staff: 3,
  },
  {
    label: "Afternoon (1–5pm)",
    orders: 520,
    // avgTime: 380,
    revenue: 1200,
    staff: 2,
  },
  {
    label: "Evening (5–9pm)",
    orders: 310,
    // avgTime: 510,
    revenue: 900,
    staff: 2,
  },
];
