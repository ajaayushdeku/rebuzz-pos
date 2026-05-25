import { StatsApiResponse, WinningApiResponse } from "@/lib/dashboardstats";
import { DataPoint } from "@/lib/types/chart";
import { HourlyData } from "../../components/dashboardComponents/overviewDash/HourlySalesChart";
import { LocationData } from "../../components/dashboardComponents/overviewDash/SalesLocationChart";
import { TopProduct } from "../../components/dashboardComponents/overviewDash/TopItems";
import { Transaction } from "../../components/dashboardComponents/orderHistory/transaction-columns";

export const mockStats: StatsApiResponse = {
  totalSales: {
    value: 999999,
    percent: 12,
  },
  totalOrders: {
    value: 1234,
    percent: 10,
  },
  productsSold: {
    value: 123,
    percent: 10,
  },
  netProfit: {
    value: 12000,
    percent: -10,
  },
};

export const mockWinningStats: WinningApiResponse = {
  topSellingProduct: {
    value: "Classic Latte",
  },
  peakHour: {
    value: "10AM - 11AM",
  },
  bestDay: {
    value: "Sunday",
  },
};

export const mockTopProducts: TopProduct[] = [
  {
    rank: 1,
    productName: "Black Coffee",
    noOfSale: 10,
    totalRevenue: 500,
  },
  {
    rank: 2,
    productName: "Sandwich",
    noOfSale: 5,
    totalRevenue: 300,
  },
  {
    rank: 3,
    productName: "Latte",
    noOfSale: 8,
    totalRevenue: 250,
  },
];

export const mockRecentTransactions: Transaction[] = [
  {
    id: "ORD-007",
    date: "Jan 13 2025",
    timestamp: "09:50",
    customer: "Fred Johnson",
    amount: "55.50",
    paymentMethod: "Cash",
    items: [
      {
        name: "Flat White",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Toast",
        quantity: 4,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-008",
    date: "Jan 13 2025",
    timestamp: "16:30",
    customer: "Camina Drummer",
    amount: "28.00",
    paymentMethod: "Card",
    items: [
      {
        name: "Iced Coffee",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Bagel",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "refunded",
  },
];

export const mockWeeklyRevenue: DataPoint[] = [
  { day: "Mon", revenue: 13000 },
  { day: "Tue", revenue: 12000 },
  { day: "Wed", revenue: 15500 },
  { day: "Thu", revenue: 12500 },
  { day: "Fri", revenue: 17000 },
  { day: "Sat", revenue: 22000 },
  { day: "Sun", revenue: 18000 },
];

export const mockSalesLocation: LocationData[] = [
  {
    name: "Pokhara",
    value: 45,
  },
  {
    name: "Patan",
    value: 25,
  },
  {
    name: "Kathmandu",
    value: 30,
  },
];

export const mockHourlySales: HourlyData[] = [
  { hour: "7am", revenue: 580 },
  { hour: "8am", revenue: 1020 },
  { hour: "9am", revenue: 1350 },
  { hour: "10am", revenue: 2420 },
  { hour: "11am", revenue: 1900 },
  { hour: "12pm", revenue: 1580 },
  { hour: "1pm", revenue: 1420 },
  { hour: "2pm", revenue: 1080 },
  { hour: "3pm", revenue: 1020 },
  { hour: "4pm", revenue: 1130 },
  { hour: "5pm", revenue: 1420 },
  { hour: "6pm", revenue: 2050 },
  { hour: "7pm", revenue: 1720 },
  { hour: "8pm", revenue: 1050 },
];
